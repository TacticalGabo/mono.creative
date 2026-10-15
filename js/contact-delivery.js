(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonoContactDelivery = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function createClient(options) {
    const origin = options.origin;
    const fetchRequest = options.fetch || globalThis.fetch.bind(globalThis);
    const endpoint = new URL(options.endpoint, origin);
    if (endpoint.origin !== origin) throw new Error('The contact API must use this website’s origin.');
    let session = null;

    async function request(url, init, timeout = 30000) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetchRequest(url, { ...init, signal: controller.signal, credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
        if (!response.ok) {
          const error = new Error('Contact request failed.');
          error.status = response.status;
          throw error;
        }
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    }

    const json = (body) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

    return {
      async send(data, file, getToken, onStatus = () => {}) {
        // Keep the original timestamps and authorization when retrying the same brief.
        const { loadedAt, elapsedMs, submittedAt, ...identity } = data;
        const fingerprint = JSON.stringify(identity);
        if (!session || session.fingerprint !== fingerprint || session.file !== file) {
          session = { fingerprint, file, payload: JSON.parse(JSON.stringify(data)), grant: null, uploaded: false };
        }
        const current = session;
        try {
          if (!current.grant || Date.parse(current.grant.expiresAt) <= Date.now() + 5000) {
            onStatus('verifying');
            const config = await request(endpoint.href + '/config');
            if (!config.turnstileSiteKey) throw new Error('Contact verification is unavailable.');
            const turnstileToken = await getToken(config.turnstileSiteKey);
            const grant = await request(endpoint.href + '/authorize', json({ payload: current.payload, attachment: current.payload.attachment, turnstileToken }));
            if (!grant.authorization || !Number.isFinite(Date.parse(grant.expiresAt))) throw new Error('Invalid upload authorization.');
            current.grant = grant;
            current.uploaded = false;
          }
          if (file && !current.uploaded) {
            onStatus('uploading');
            if (!current.grant.uploadUrl) throw new Error('Missing upload URL.');
            const upload = new URL(current.grant.uploadUrl, origin);
            if (upload.origin !== origin || !upload.pathname.startsWith(endpoint.pathname + '/')) throw new Error('Invalid upload URL.');
            await request(upload.href, {
              method: 'PUT', headers: { 'Content-Type': 'application/octet-stream', Authorization: 'Bearer ' + current.grant.authorization }, body: file
            }, 5 * 60 * 1000);
            current.uploaded = true;
          }
          onStatus('sending');
          const result = await request(endpoint.href, json({ payload: current.payload, authorization: current.grant.authorization }));
          if (result.ok !== true) throw new Error('The brief was not accepted.');
          return result;
        } catch (error) {
          if ([401, 403, 410].includes(error.status)) current.grant = null;
          throw error;
        }
      }
    };
  }

  return { createClient };
});
