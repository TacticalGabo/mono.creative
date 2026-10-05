window.MONO_CONTACT_CONFIG = Object.assign({
  // HTTPS endpoint accepting multipart FormData: payload (JSON) and optional deck.
  endpoint: '',
  // Preview mode bypasses validation and never sends a real enquiry.
  testing: true
}, window.MONO_CONTACT_CONFIG || {});

