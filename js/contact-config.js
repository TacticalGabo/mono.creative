window.MONO_CONTACT_CONFIG = Object.assign({
  // Same-origin Cloudflare Pages Function. No Make URL or secret belongs here.
  endpoint: '/api/contact',
  // Set true explicitly for a visual-only preview; it never sends an enquiry.
  testing: false
}, window.MONO_CONTACT_CONFIG || {});

