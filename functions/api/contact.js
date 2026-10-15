import rules from '../../js/contact-rules.js';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_JSON_BYTES = 32 * 1024;
const AUTH_LIFETIME_MS = 15 * 60 * 1000;
const DELIVERY_LEASE_MS = 45 * 1000;
const SERVICE_OPTIONS = ['UX/UI Design', 'Brand Direction', 'Illustration', 'Packaging', 'Motion design', '3D Art', 'Not sure yet'];
const TIME_OPTIONS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
const ID_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;
const encoder = new TextEncoder();

class ContactError extends Error {
  constructor(status, code, message, retryAfter) {
    super(message);
    Object.assign(this, { status, code, retryAfter });
  }
}

function fail(status, code, message, retryAfter) {
  throw new ContactError(status, code, message, retryAfter);
}

function json(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders }
  });
}

function configuration(env) {
  const origins = String(env.CONTACT_ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean);
  if (!env.CONTACT_BUCKET || !env.TURNSTILE_SITE_KEY || !env.TURNSTILE_SECRET_KEY ||
      typeof env.CONTACT_SIGNING_KEY !== 'string' || env.CONTACT_SIGNING_KEY.length < 32 ||
      typeof env.MAKE_DOWNLOAD_TOKEN !== 'string' || env.MAKE_DOWNLOAD_TOKEN.length < 32 || !origins.length) {
    fail(503, 'not_configured', 'The contact form is not configured yet.');
  }
  for (const origin of origins) {
    let url;
    try { url = new URL(origin); } catch { fail(503, 'not_configured', 'Invalid contact origin configuration.'); }
    if (url.origin !== origin || url.username || url.password ||
        (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) {
      fail(503, 'not_configured', 'Contact origins must be exact HTTPS origins.');
    }
  }
  let webhook;
  try { webhook = new URL(env.MAKE_WEBHOOK_URL); } catch { fail(503, 'not_configured', 'The delivery service is not configured yet.'); }
  if (webhook.protocol !== 'https:' || webhook.username || webhook.password) fail(503, 'not_configured', 'The delivery service requires HTTPS.');
  return { origins, webhook: webhook.href };
}

function requireOrigin(request, config, mutation = false) {
  const url = new URL(request.url);
  if (!config.origins.includes(url.origin)) fail(403, 'origin_forbidden', 'This origin cannot use the contact form.');
  const origin = request.headers.get('Origin');
  if ((mutation && origin !== url.origin) || (origin && origin !== url.origin)) fail(403, 'origin_forbidden', 'A same-origin request is required.');
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) fail(403, 'origin_forbidden', 'A same-origin request is required.');
  return url;
}

async function readJson(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    fail(415, 'json_required', 'Send JSON for this request.');
  }
  const length = request.headers.get('Content-Length');
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_JSON_BYTES)) fail(413, 'payload_too_large', 'The form data is too large.');
  if (!request.body) fail(400, 'invalid_json', 'The form data is missing.');
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_JSON_BYTES) {
        await reader.cancel();
        fail(413, 'payload_too_large', 'The form data is too large.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => { bytes.set(chunk, offset); offset += chunk.byteLength; });
  let value;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { fail(400, 'invalid_json', 'The form data is invalid.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_json', 'Send a JSON object.');
  return value;
}

function textField(value, maxLength, field, optional = false) {
  if (value == null && optional) return '';
  if (typeof value !== 'string' || value.length > maxLength) fail(400, 'invalid_payload', 'Invalid ' + field + '.');
  return value;
}

function normalizeAttachment(value) {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_attachment', 'Invalid attachment.');
  const name = textField(value.name, 255, 'attachment name').normalize('NFC');
  // Keep a readable filename, but reject separators, controls and bidi overrides.
  if (!name.trim() || /[\u0000-\u001f\u007f/\\\u202a-\u202e\u2066-\u2069]/u.test(name)) fail(400, 'invalid_attachment', 'Use a simple filename.');
  if (!Number.isSafeInteger(value.size) || value.size <= 0 || value.size > MAX_FILE_BYTES) fail(413, 'invalid_attachment_size', 'Use a non-empty file of 20 MiB or less.');
  const error = rules.validateFile({ name, size: value.size });
  if (error) fail(400, 'invalid_attachment', error);
  // Derive the informational type from the allowed extension; browser MIME is untrusted.
  const extension = name.split('.').pop().toLowerCase();
  const type = { pdf: 'application/pdf', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', key: 'application/vnd.apple.keynote', keynote: 'application/vnd.apple.keynote' }[extension];
  return { name, size: value.size, type };
}

function zonedParts(date, timeZone) {
  try {
    return Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).map((part) => [part.type, part.value]));
  } catch { fail(400, 'invalid_call_slot', 'Choose a valid time zone.'); }
}

function normalizeSlot(slot, now) {
  if (slot == null) return null;
  if (typeof slot !== 'object' || !slot.local || typeof slot.local !== 'object') fail(400, 'invalid_call_slot', 'Choose a valid call time.');
  const zone = textField(slot.local.timeZone, 100, 'time zone');
  const date = textField(slot.local.date, 10, 'call date');
  const time = textField(slot.local.time, 5, 'call time');
  const startsAt = new Date(textField(slot.startsAt, 40, 'call timestamp'));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !TIME_OPTIONS.includes(time) || Number.isNaN(startsAt.getTime()) || startsAt <= now) {
    fail(400, 'invalid_call_slot', 'Choose an available weekday and time.');
  }
  const local = zonedParts(startsAt, zone);
  const localDate = local.year + '-' + local.month + '-' + local.day;
  const localTime = local.hour + ':' + local.minute;
  if (localDate !== date || localTime !== time || startsAt.getUTCSeconds() || startsAt.getUTCMilliseconds()) fail(400, 'invalid_call_slot', 'The call time does not match its time zone.');
  const today = zonedParts(now, zone);
  const todayUtc = Date.UTC(+today.year, +today.month - 1, +today.day, 12);
  const weekday = new Date(todayUtc).getUTCDay();
  const lastDay = todayUtc + ((weekday === 0 ? -6 : 1 - weekday) + 18) * 86400000;
  const chosenDay = Date.parse(date + 'T12:00:00Z');
  if (chosenDay <= todayUtc || chosenDay > lastDay || [0, 6].includes(new Date(chosenDay).getUTCDay())) {
    fail(400, 'invalid_call_slot', 'Choose an available weekday.');
  }
  const lima = zonedParts(startsAt, 'America/Lima');
  return {
    tentative: true, durationMinutes: 30, startsAt: startsAt.toISOString(),
    local: { date, time, timeZone: zone },
    lima: { date: lima.year + '-' + lima.month + '-' + lima.day, time: lima.hour + ':' + lima.minute, timeZone: 'America/Lima', utcOffset: '-05:00' }
  };
}

function normalizePayload(raw, now = new Date()) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !ID_PATTERN.test(raw.id)) fail(400, 'invalid_payload', 'Invalid submission ID.');
  const name = rules.validateName(textField(raw.name, 200, 'name'));
  const email = rules.validateEmail(textField(raw.email, 254, 'email'));
  const telegram = rules.validateTelegram(textField(raw.telegram, 200, 'Telegram', true));
  const brief = rules.validateBrief(textField(raw.brief, 4000, 'project notes', true));
  for (const field of [name, email, telegram, brief]) if (field.error) fail(400, 'invalid_payload', field.error);
  if (!Array.isArray(raw.services) || !raw.services.length || raw.services.length > SERVICE_OPTIONS.length ||
      raw.services.some((service) => !SERVICE_OPTIONS.includes(service)) || new Set(raw.services).size !== raw.services.length ||
      (raw.services.includes('Not sure yet') && raw.services.length !== 1)) fail(400, 'invalid_payload', 'Choose valid services.');
  if (!Array.isArray(raw.links) || raw.links.length > 5) fail(400, 'invalid_payload', 'Use up to five links.');
  const links = rules.validateLinks(raw.links.map((link) => textField(link, 2048, 'link')));
  if (links.errors.some(Boolean)) fail(400, 'invalid_payload', links.errors.find(Boolean));
  if (textField(raw.website, 500, 'website', true) || rules.isSpam(name.value, brief.value)) fail(400, 'invalid_payload', 'The form could not be accepted.');
  if (!Number.isSafeInteger(raw.elapsedMs) || raw.elapsedMs < 3000 || raw.elapsedMs > 7 * 86400000) fail(400, 'invalid_payload', 'Please take a moment to complete the form.');
  const loadedAt = new Date(textField(raw.loadedAt, 40, 'load timestamp'));
  const submittedAt = new Date(textField(raw.submittedAt, 40, 'submission timestamp'));
  if (Number.isNaN(loadedAt.getTime()) || Number.isNaN(submittedAt.getTime()) || submittedAt < loadedAt) fail(400, 'invalid_payload', 'Invalid form timestamps.');
  return {
    id: raw.id, name: name.value, email: email.value, telegram: telegram.value,
    services: [...raw.services], links: links.values.filter(Boolean), brief: brief.value,
    callSlot: normalizeSlot(raw.callSlot, now), attachment: normalizeAttachment(raw.attachment),
    website: '', loadedAt: loadedAt.toISOString(), elapsedMs: raw.elapsedMs, submittedAt: submittedAt.toISOString(), suspectedSpam: false
  };
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Url(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) fail(401, 'invalid_authorization', 'The upload authorization is invalid.');
  try { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0)); }
  catch { fail(401, 'invalid_authorization', 'The upload authorization is invalid.'); }
}

async function digest(value) {
  return base64Url(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function signingKey(secret, usages) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);
}

async function signAuthorization(claims, secret) {
  const body = base64Url(encoder.encode(JSON.stringify(claims)));
  const signature = await crypto.subtle.sign('HMAC', await signingKey(secret, ['sign']), encoder.encode(body));
  return body + '.' + base64Url(signature);
}

async function verifyAuthorization(value, env, origin) {
  if (typeof value !== 'string' || value.length > 4096) fail(401, 'invalid_authorization', 'The upload authorization is missing.');
  const parts = value.split('.');
  if (parts.length !== 2 || !await crypto.subtle.verify('HMAC', await signingKey(env.CONTACT_SIGNING_KEY, ['verify']), decodeBase64Url(parts[1]), encoder.encode(parts[0]))) {
    fail(401, 'invalid_authorization', 'The upload authorization is invalid.');
  }
  let claims;
  try { claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))); }
  catch { fail(401, 'invalid_authorization', 'The upload authorization is invalid.'); }
  if (!claims || claims.v !== 1 || !ID_PATTERN.test(claims.id) || claims.origin !== origin ||
      !Number.isSafeInteger(claims.exp) || !Number.isSafeInteger(claims.iat) || claims.exp - claims.iat !== AUTH_LIFETIME_MS ||
      !/^[A-Za-z0-9_-]{43}$/.test(claims.hash)) fail(401, 'invalid_authorization', 'The upload authorization is invalid.');
  if (claims.exp <= Date.now()) fail(401, 'authorization_expired', 'The upload authorization expired. Please try again.');
  return claims;
}

function bearer(request) {
  const header = request.headers.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

async function verifyTurnstile(request, env, token, hostname) {
  if (typeof token !== 'string' || !token.length || token.length > 2048) fail(400, 'verification_required', 'Complete the security check.');
  let response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(10000),
      body: JSON.stringify({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') || undefined, idempotency_key: crypto.randomUUID() })
    });
  } catch { fail(503, 'verification_unavailable', 'The security check is unavailable. Please try again.'); }
  if (!response.ok) fail(503, 'verification_unavailable', 'The security check is unavailable. Please try again.');
  let result;
  try { result = await response.json(); } catch { fail(503, 'verification_unavailable', 'The security check is unavailable. Please try again.'); }
  if (result.success !== true || result.action !== 'contact' || result.hostname !== hostname) fail(403, 'verification_failed', 'The security check expired or failed. Please try again.');
}

function attachmentKey(claims) { return 'contact/attachments/' + claims.id + '/' + claims.hash; }
function receiptKey(id) { return 'contact/receipts/' + id + '.json'; }

async function authorize(request, env, url) {
  const data = await readJson(request);
  const payload = normalizePayload(data.payload);
  const attachment = normalizeAttachment(data.attachment);
  if (JSON.stringify(payload.attachment) !== JSON.stringify(attachment)) fail(400, 'invalid_attachment', 'The attachment does not match the form.');
  await verifyTurnstile(request, env, data.turnstileToken, url.hostname);
  const now = Date.now();
  const claims = { v: 1, id: payload.id, hash: await digest(JSON.stringify(payload)), origin: url.origin, attachment, iat: now, exp: now + AUTH_LIFETIME_MS };
  const authorization = await signAuthorization(claims, env.CONTACT_SIGNING_KEY);
  return json({ authorization, uploadUrl: attachment ? '/api/contact/upload' : null, expiresAt: new Date(claims.exp).toISOString() });
}

function matchesAttachment(object, claims) {
  return object && object.size === claims.attachment.size && object.customMetadata?.requestId === claims.id && object.customMetadata?.payloadHash === claims.hash;
}

async function upload(request, env, url) {
  const claims = await verifyAuthorization(bearer(request), env, url.origin);
  if (!claims.attachment) fail(400, 'no_attachment', 'No attachment was authorized.');
  if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/octet-stream' || request.headers.has('Content-Encoding')) {
    fail(415, 'binary_required', 'Send the original file as application/octet-stream.');
  }
  const length = request.headers.get('Content-Length');
  if (length && (!/^\d+$/.test(length) || Number(length) !== claims.attachment.size)) fail(413, 'attachment_size_mismatch', 'The file size does not match the authorization.');
  if (!request.body) fail(400, 'missing_attachment', 'The file is missing.');
  const key = attachmentKey(claims);
  const existing = await env.CONTACT_BUCKET.head(key);
  if (existing) {
    await request.body.cancel();
    if (!matchesAttachment(existing, claims)) fail(409, 'attachment_conflict', 'This attachment cannot be replaced.');
    return json({ ok: true, requestId: claims.id });
  }
  // Native exact-length enforcement avoids buffering a 20 MiB file in Worker memory.
  // R2's conditional creation is the final guard against simultaneous uploads/replays.
  const stream = new FixedLengthStream(claims.attachment.size);
  const abort = new AbortController();
  let pumpError;
  const pumping = request.body.pipeTo(stream.writable, { signal: abort.signal }).catch((error) => { pumpError = error; });
  let object;
  try {
    object = await env.CONTACT_BUCKET.put(key, stream.readable, {
      onlyIf: new Headers({ 'If-None-Match': '*' }),
      httpMetadata: { contentType: 'application/octet-stream', cacheControl: 'no-store' },
      customMetadata: { requestId: claims.id, payloadHash: claims.hash, filename: claims.attachment.name, type: claims.attachment.type }
    });
    if (!object) abort.abort();
    await pumping;
    if (pumpError && object) fail(413, 'attachment_size_mismatch', 'The uploaded file was incomplete or exceeded its authorized size.');
  } catch (error) {
    abort.abort();
    await pumping;
    if (error instanceof ContactError) throw error;
    if (pumpError) fail(413, 'attachment_size_mismatch', 'The uploaded file was incomplete or exceeded its authorized size.');
    throw error;
  }
  if (!object && !matchesAttachment(await env.CONTACT_BUCKET.head(key), claims)) fail(409, 'attachment_conflict', 'This attachment could not be stored.');
  return json({ ok: true, requestId: claims.id });
}

async function readReceipt(bucket, id) {
  const object = await bucket.get(receiptKey(id));
  if (!object) return null;
  return { value: await object.json(), etag: object.etag };
}

async function putReceipt(bucket, value, etag) {
  return bucket.put(receiptKey(value.id), JSON.stringify(value), {
    onlyIf: etag ? { etagMatches: etag } : new Headers({ 'If-None-Match': '*' }),
    httpMetadata: { contentType: 'application/json', cacheControl: 'no-store' }
  });
}

async function submit(request, env, url, config) {
  const data = await readJson(request);
  const claims = await verifyAuthorization(data.authorization, env, url.origin);
  const payload = normalizePayload(data.payload);
  if (payload.id !== claims.id || await digest(JSON.stringify(payload)) !== claims.hash) fail(403, 'payload_changed', 'The form changed after authorization. Please try again.');
  let receipt = await readReceipt(env.CONTACT_BUCKET, claims.id);
  if (receipt?.value.hash !== undefined && receipt.value.hash !== claims.hash) fail(409, 'submission_conflict', 'This submission ID is already used. Reload the form to send another brief.');
  if (receipt?.value.status === 'delivered') return json({ ok: true, requestId: claims.id });
  if (receipt?.value.status === 'delivering' && receipt.value.leaseUntil > Date.now()) fail(409, 'submission_in_progress', 'Your brief is being delivered. Try again in a moment.', 5);
  let attachment = null;
  if (claims.attachment) {
    const key = attachmentKey(claims);
    if (!matchesAttachment(await env.CONTACT_BUCKET.head(key), claims)) fail(409, 'attachment_required', 'Upload the attachment before sending your brief.');
    attachment = { ...claims.attachment, key, downloadUrl: url.origin + '/api/contact/attachment?id=' + encodeURIComponent(claims.id) };
  }
  const pending = {
    id: claims.id, hash: claims.hash, status: 'delivering', attemptId: crypto.randomUUID(),
    leaseUntil: Date.now() + DELIVERY_LEASE_MS, attachment, receivedAt: receipt?.value.receivedAt || new Date().toISOString()
  };
  const lock = await putReceipt(env.CONTACT_BUCKET, pending, receipt?.etag);
  if (!lock) fail(409, 'submission_in_progress', 'Your brief is being delivered. Try again in a moment.', 5);
  let accepted = false;
  try {
    const response = await fetch(config.webhook, {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': claims.id },
      body: JSON.stringify({ ...payload, attachment, receivedAt: pending.receivedAt })
    });
    accepted = response.ok;
    await response.body?.cancel();
  } catch { /* An ambiguous timeout is retryable; Make must deduplicate payload.id. */ }
  if (!accepted) {
    await putReceipt(env.CONTACT_BUCKET, { ...pending, status: 'retryable', leaseUntil: 0 }, lock.etag);
    fail(502, 'delivery_failed', 'Your brief could not be confirmed. Please try again.');
  }
  const saved = await putReceipt(env.CONTACT_BUCKET, { ...pending, status: 'delivered', leaseUntil: 0, deliveredAt: new Date().toISOString() }, lock.etag);
  if (!saved) fail(503, 'delivery_unconfirmed', 'Delivery could not be confirmed. Please try again.');
  return json({ ok: true, requestId: claims.id });
}

async function download(request, env, url) {
  // HMAC verification gives a constant-time comparison without exposing the secret.
  const token = bearer(request);
  const key = await signingKey(env.MAKE_DOWNLOAD_TOKEN, ['sign', 'verify']);
  const expected = await crypto.subtle.sign('HMAC', key, encoder.encode(env.MAKE_DOWNLOAD_TOKEN));
  if (!token || token.length > 1024 || !await crypto.subtle.verify('HMAC', key, expected, encoder.encode(token))) {
    fail(401, 'download_unauthorized', 'A valid download credential is required.');
  }
  const id = url.searchParams.get('id') || '';
  if (!ID_PATTERN.test(id)) fail(404, 'attachment_not_found', 'Attachment not found.');
  const receipt = await readReceipt(env.CONTACT_BUCKET, id);
  const attachment = receipt?.value.attachment;
  if (!attachment) fail(404, 'attachment_not_found', 'Attachment not found.');
  const object = await env.CONTACT_BUCKET.get(attachment.key);
  if (!object || object.size !== attachment.size) fail(404, 'attachment_not_found', 'Attachment not found.');
  const filename = attachment.name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encodedName = encodeURIComponent(attachment.name).replace(/['()*]/g, (char) => '%' + char.charCodeAt(0).toString(16).toUpperCase());
  return new Response(object.body, { headers: {
    'Content-Type': 'application/octet-stream', 'Content-Length': String(object.size),
    'Content-Disposition': 'attachment; filename="' + filename + '"; filename*=UTF-8\'\'' + encodedName,
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox"
  } });
}

export async function onRequest({ request, env }) {
  try {
    const config = configuration(env);
    const url = new URL(request.url);
    const route = url.pathname.replace(/\/$/, '');
    if (route === '/api/contact/attachment' && request.method === 'GET') {
      if (!config.origins.includes(url.origin)) fail(403, 'origin_forbidden', 'This origin cannot serve attachments.');
      return await download(request, env, url);
    }
    requireOrigin(request, config, ['POST', 'PUT'].includes(request.method));
    if (route === '/api/contact/config' && request.method === 'GET') return json({ turnstileSiteKey: env.TURNSTILE_SITE_KEY, maxFileBytes: MAX_FILE_BYTES });
    if (route === '/api/contact/authorize' && request.method === 'POST') return await authorize(request, env, url);
    if (route === '/api/contact/upload' && request.method === 'PUT') return await upload(request, env, url);
    if (route === '/api/contact' && request.method === 'POST') return await submit(request, env, url, config);
    return json({ error: { code: 'not_found', message: 'Endpoint not found.' } }, 404);
  } catch (error) {
    if (error instanceof ContactError) return json({ error: { code: error.code, message: error.message } }, error.status, error.retryAfter ? { 'Retry-After': String(error.retryAfter) } : {});
    // Do not log payloads, filenames, tokens, webhook URLs, or credentials.
    console.error('Contact API request failed.');
    return json({ error: { code: 'service_unavailable', message: 'The contact service is unavailable. Please try again.' } }, 503);
  }
}
