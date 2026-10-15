'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createClient } = require('../js/contact-delivery.js');

const ORIGIN = 'https://mono.example';
const ENDPOINT = '/api/contact';
const FILE_CONTENT = 'private attachment contents must never appear in a JSON submission';

class FakeFile extends Blob {
  constructor(name = 'brief.pdf', contents = FILE_CONTENT) {
    super([contents], { type: 'application/pdf' });
    this.name = name;
    this.lastModified = 1700000000000;
  }
}

function payload(file, changes = {}) {
  return {
    name: 'Example Client', email: 'client@example.com', brief: 'A brand identity project.',
    services: ['Brand identity'], website: '',
    attachment: file ? { name: file.name, size: file.size, type: file.type } : null,
    loadedAt: '2026-10-15T15:00:00.000Z', elapsedMs: 20000,
    submittedAt: '2026-10-15T15:00:20.000Z',
    ...changes
  };
}

function grant(changes = {}) {
  return {
    authorization: 'signed-upload-and-submission-reference',
    expiresAt: new Date(Date.now() + 60000).toISOString(),
    uploadUrl: ENDPOINT + '/upload',
    ...changes
  };
}

function config() {
  return { path: ENDPOINT + '/config', body: { turnstileSiteKey: 'test-site-key' } };
}

function authorize(body = grant(), status = 200) {
  return { path: ENDPOINT + '/authorize', method: 'POST', body, status };
}

function upload(status = 200) {
  return { path: ENDPOINT + '/upload', method: 'PUT', body: { ok: true }, status };
}

function submit(status = 200, body = { ok: true }) {
  return { path: ENDPOINT, method: 'POST', body, status };
}

function fixture(steps) {
  const calls = [];
  const tokens = [];
  const fetch = async (url, init) => {
    const step = steps[calls.length];
    assert.ok(step, 'No unexpected network requests');
    calls.push({ url, ...init });
    assert.equal(url, ORIGIN + step.path);
    assert.equal(init.method || 'GET', step.method || 'GET');
    return { ok: (step.status || 200) < 400, status: step.status || 200, json: async () => step.body };
  };
  return {
    client: createClient({ origin: ORIGIN, endpoint: ENDPOINT, fetch }), calls, tokens,
    getToken: async (siteKey) => { tokens.push(siteKey); return 'fresh-turnstile-token-' + tokens.length; },
    done: () => assert.equal(calls.length, steps.length, 'All expected requests completed')
  };
}

test('authorizes the brief, uploads the original file privately, then submits metadata and its authorization reference', async () => {
  const file = new FakeFile();
  const data = payload(file);
  const f = fixture([config(), authorize(), upload(), submit()]);
  const statuses = [];

  assert.deepEqual(await f.client.send(data, file, f.getToken, (state) => statuses.push(state)), { ok: true });
  assert.deepEqual(statuses, ['verifying', 'uploading', 'sending']);
  assert.deepEqual(f.tokens, ['test-site-key']);
  const authorizationBody = JSON.parse(f.calls[1].body);
  assert.deepEqual(authorizationBody, { payload: data, attachment: data.attachment, turnstileToken: 'fresh-turnstile-token-1' });
  assert.equal(f.calls[2].body, file);
  assert.equal(await f.calls[2].body.text(), FILE_CONTENT);
  assert.equal(f.calls[2].headers['Content-Type'], 'application/octet-stream');
  assert.equal(f.calls[2].headers.Authorization, 'Bearer signed-upload-and-submission-reference');
  const submission = JSON.parse(f.calls[3].body);
  assert.deepEqual(submission, { payload: data, authorization: 'signed-upload-and-submission-reference' });
  assert.deepEqual(submission.payload.attachment, { name: 'brief.pdf', size: file.size, type: 'application/pdf' });
  for (const call of [f.calls[1], f.calls[3]]) {
    assert.equal(call.headers['Content-Type'], 'application/json');
    assert.ok(!call.body.includes(FILE_CONTENT), 'JSON must not contain private file contents');
    assert.ok(!call.body.includes(Buffer.from(FILE_CONTENT).toString('base64')), 'JSON must not contain base64 file contents');
  }
  for (const call of f.calls) {
    assert.equal(call.credentials, 'same-origin');
    assert.equal(call.redirect, 'error');
    assert.equal(call.cache, 'no-store');
    assert.ok(call.signal instanceof AbortSignal);
  }
  f.done();
});

test('a brief without an attachment is authorized and submitted without an upload', async () => {
  const f = fixture([config(), authorize(grant({ uploadUrl: null })), submit()]);
  const statuses = [];
  await f.client.send(payload(null), null, f.getToken, (state) => statuses.push(state));
  assert.deepEqual(statuses, ['verifying', 'sending']);
  assert.equal(JSON.parse(f.calls[2].body).payload.attachment, null);
  f.done();
});

test('an upload failure prevents submission and retry uploads again using the existing grant', async () => {
  const file = new FakeFile();
  const f = fixture([config(), authorize(), upload(503), upload(), submit()]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), { status: 503 });
  assert.equal(f.calls.length, 3);
  await f.client.send(payload(file), file, f.getToken);
  assert.equal(f.tokens.length, 1);
  assert.equal(f.calls[3].body, file);
  f.done();
});

test('submission retry preserves the grant, uploaded file, and original payload timestamps', async () => {
  const file = new FakeFile();
  const first = payload(file);
  const f = fixture([config(), authorize(), upload(), submit(503), submit()]);
  await assert.rejects(f.client.send(first, file, f.getToken), { status: 503 });
  const retry = payload(file, {
    loadedAt: '2026-10-15T15:01:00.000Z', elapsedMs: 70000,
    submittedAt: '2026-10-15T15:01:10.000Z'
  });
  await f.client.send(retry, file, f.getToken);
  assert.equal(f.calls[3].body, f.calls[4].body);
  assert.deepEqual(JSON.parse(f.calls[4].body).payload, first);
  assert.equal(f.tokens.length, 1);
  f.done();
});

test('replacing a file reauthorizes even when the filename, content, and metadata match', async () => {
  const file = new FakeFile();
  const replacement = new FakeFile();
  const f = fixture([config(), authorize(), upload(), submit(503), config(), authorize(grant({ authorization: 'new-file-grant' })), upload(), submit()]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), { status: 503 });
  await f.client.send(payload(replacement), replacement, f.getToken);
  assert.equal(f.tokens.length, 2);
  assert.equal(f.calls[6].body, replacement);
  assert.equal(JSON.parse(f.calls[7].body).authorization, 'new-file-grant');
  f.done();
});

test('editing the brief reauthorizes and binds the new payload before uploading again', async () => {
  const file = new FakeFile();
  const f = fixture([config(), authorize(), upload(), submit(503), config(), authorize(), upload(), submit()]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), { status: 503 });
  const edited = payload(file, { brief: 'The project now also needs a website.', elapsedMs: 90000, submittedAt: '2026-10-15T15:01:30.000Z' });
  await f.client.send(edited, file, f.getToken);
  assert.deepEqual(JSON.parse(f.calls[5].body).payload, edited);
  assert.deepEqual(JSON.parse(f.calls[7].body).payload, edited);
  assert.equal(f.tokens.length, 2);
  f.done();
});

for (const status of [401, 403, 410]) {
  test(`a ${status} during upload clears authorization so retry obtains a fresh grant`, async () => {
    const file = new FakeFile();
    const f = fixture([config(), authorize(), upload(status), config(), authorize(grant({ authorization: 'replacement-grant' })), upload(), submit()]);
    await assert.rejects(f.client.send(payload(file), file, f.getToken), { status });
    await f.client.send(payload(file), file, f.getToken);
    assert.equal(f.tokens.length, 2);
    assert.equal(f.calls[5].headers.Authorization, 'Bearer replacement-grant');
    f.done();
  });
}

test('a rejected submission authorization obtains a fresh grant and reuploads', async () => {
  const file = new FakeFile();
  const f = fixture([config(), authorize(), upload(), submit(410), config(), authorize(), upload(), submit()]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), { status: 410 });
  await f.client.send(payload(file), file, f.getToken);
  assert.equal(f.tokens.length, 2);
  f.done();
});

test('an expired grant is refreshed before retrying submission', async (t) => {
  const now = Date.now();
  const file = new FakeFile();
  const f = fixture([config(), authorize(grant({ expiresAt: new Date(now + 10000).toISOString() })), upload(), submit(503), config(), authorize(grant({ expiresAt: new Date(now + 90000).toISOString(), authorization: 'renewed-grant' })), upload(), submit()]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), { status: 503 });
  t.mock.method(Date, 'now', () => now + 11000);
  await f.client.send(payload(file), file, f.getToken);
  assert.equal(f.tokens.length, 2);
  assert.equal(JSON.parse(f.calls[7].body).authorization, 'renewed-grant');
  f.done();
});

test('an external contact endpoint is refused before making a network request', () => {
  let called = false;
  assert.throws(() => createClient({ origin: ORIGIN, endpoint: 'https://external.example/api/contact', fetch: async () => { called = true; } }), /origin/);
  assert.equal(called, false);
});

for (const uploadUrl of ['https://external.example/upload', '/unrelated/upload', '/api/contact-other/upload', '/api/contact/../../outside']) {
  test(`refuses unauthorized upload destination ${uploadUrl}`, async () => {
    const file = new FakeFile();
    const f = fixture([config(), authorize(grant({ uploadUrl }))]);
    await assert.rejects(f.client.send(payload(file), file, f.getToken), /Invalid upload URL/);
    f.done();
  });
}

test('a missing Turnstile configuration prevents authorization, upload, and submission', async () => {
  const file = new FakeFile();
  const f = fixture([{ path: ENDPOINT + '/config', body: {} }]);
  await assert.rejects(f.client.send(payload(file), file, f.getToken), /verification is unavailable/);
  assert.equal(f.tokens.length, 0);
  f.done();
});

test('a successful HTTP response without acceptance is a submission failure', async () => {
  const f = fixture([config(), authorize(), submit(200, { ok: false })]);
  await assert.rejects(f.client.send(payload(null), null, f.getToken), /not accepted/);
  f.done();
});

for (const malformed of [grant({ authorization: undefined }), grant({ expiresAt: 'invalid-date' })]) {
  test(`malformed grant (${malformed.authorization ? 'expiration' : 'authorization'}) is discarded before retry`, async () => {
    const file = new FakeFile();
    const f = fixture([config(), authorize(malformed), config(), authorize(), upload(), submit()]);
    await assert.rejects(f.client.send(payload(file), file, f.getToken), /Invalid upload authorization/);
    await f.client.send(payload(file), file, f.getToken);
    assert.equal(f.tokens.length, 2);
    f.done();
  });
}
