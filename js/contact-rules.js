(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MonoContactRules = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var NAME_ERROR = 'Just your name is fine';
  var EMAIL_ERROR = "That email doesn't look right";
  var TELEGRAM_ERROR = 'Telegram handles look like @yourname';
  var LINK_ERROR = "That link doesn't look complete";
  var SHORT_LINK_ERROR = 'Please use the full link, not a shortened one';
  var BRIEF_ERROR = "Keep it under 1000 \u2014 we'll talk details on the call";
  var SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rebrand.ly', 'shorturl.at', 'tiny.cc', 'rb.gy', 's.id', 'lnkd.in'];
  var DISPOSABLE_DOMAINS = ['mailinator.com', 'mailinator.net', '10minutemail.com', '10minutemail.net', 'temp-mail.org', 'temp-mail.io', 'tempmail.com', 'tempmail.net', 'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'sharklasers.com', 'grr.la', 'yopmail.com', 'yopmail.fr', 'yopmail.net', 'throwawaymail.com', 'dispostable.com', 'getnada.com', 'maildrop.cc'];
  var EMAIL_TYPOS = { gmial: 'gmail', gmal: 'gmail', gmai: 'gmail', hotmial: 'hotmail', hotmal: 'hotmail', outlok: 'outlook', yaho: 'yahoo' };

  function clean(raw) {
    return String(raw == null ? '' : raw).normalize('NFC').trim();
  }

  function length(value) {
    return Array.from(value).length;
  }

  function listedDomain(host, domains) {
    return domains.some(function (domain) {
      return host === domain || host.endsWith('.' + domain);
    });
  }

  function validateName(raw) {
    var value = clean(raw).replace(/\s+/gu, ' ');
    var looksLikeUrl = /(?:https?:\/\/|www\.|\.(?:com|net|org|io|xyz|co|app|dev|me|edu|gov|biz|info)(?:\b|\/))/i.test(value);
    var valid = length(value) >= 2 && length(value) <= 60 && /^[\p{L}\p{M} .'\-]+$/u.test(value) && /\p{L}/u.test(value) && !looksLikeUrl;
    return { value: value, error: valid ? '' : NAME_ERROR };
  }

  function validateEmail(raw) {
    var value = clean(raw);
    var parts = value.split('@');
    if (parts.length !== 2) return { value: value, error: EMAIL_ERROR, suggestion: '' };
    var local = parts[0];
    var domain = parts[1].toLowerCase();
    value = local + '@' + domain;
    var labels = domain.split('.');
    var validLocal = local.length > 0 && local.length <= 64 && /^[a-z0-9!#$%&'*+\-/=?^_`{|}~.]+$/i.test(local) && !/^\.|\.$|\.\./.test(local);
    var validDomain = labels.length >= 2 && labels.every(function (label) {
      return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
    }) && /^[a-z]{2,63}$/i.test(labels[labels.length - 1]);
    if (value.length > 254 || !validLocal || !validDomain || listedDomain(domain, DISPOSABLE_DOMAINS)) {
      return { value: value, error: EMAIL_ERROR, suggestion: '' };
    }
    var corrected = labels.slice();
    if (corrected.length === 2 && EMAIL_TYPOS[corrected[0]]) corrected[0] = EMAIL_TYPOS[corrected[0]];
    if (corrected[corrected.length - 1] === 'con') corrected[corrected.length - 1] = 'com';
    var suggestedDomain = corrected.join('.');
    return { value: value, error: '', suggestion: suggestedDomain === domain ? '' : local + '@' + suggestedDomain };
  }

  function validateTelegram(raw) {
    var value = clean(raw);
    if (!value) return { value: '', error: '' };
    var handle = value.replace(/^(?:https?:\/\/)?(?:www\.)?t\.me\//i, '').replace(/^@/, '').replace(/\/$/, '');
    var valid = /^[a-z][a-z0-9_]{3,30}[a-z0-9]$/i.test(handle);
    return { value: valid ? '@' + handle : value, error: valid ? '' : TELEGRAM_ERROR };
  }

  function normalizeLink(raw) {
    var value = clean(raw);
    if (!value) return { value: '', error: '' };
    if (/\s/u.test(value) || value.indexOf('\\') !== -1) return { value: value, error: LINK_ERROR };
    var hostWithPort = /^[^\s/:?#]+\.[^\s/:?#]+:\d+(?:[/?#]|$)/.test(value);
    if (/^[a-z][a-z0-9+.-]*:/i.test(value) && !/^https?:\/\//i.test(value) && !hostWithPort) return { value: value, error: LINK_ERROR };
    if (!/^https?:\/\//i.test(value)) value = 'https://' + value;
    try {
      var url = new URL(value);
      var host = url.hostname.toLowerCase().replace(/\.$/, '');
      var labels = host.split('.');
      var validHost = labels.length >= 2 && labels.every(function (label) {
        return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label);
      }) && /^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(labels[labels.length - 1]);
      if (!/^https?:$/.test(url.protocol) || !validHost || url.username || url.password) return { value: clean(raw), error: LINK_ERROR };
      url.hostname = host;
      value = url.href;
      return { value: value, error: listedDomain(host, SHORTENERS) ? SHORT_LINK_ERROR : '' };
    } catch (error) {
      return { value: clean(raw), error: LINK_ERROR };
    }
  }

  function validateLinks(rawLinks) {
    var links = Array.isArray(rawLinks) ? rawLinks : [];
    var values = [];
    var errors = [];
    var seen = new Set();
    links.forEach(function (raw, index) {
      var result = normalizeLink(raw);
      var error = result.error;
      if (index >= 5) error = 'Keep it to 5 links';
      if (result.value && !error) {
        var duplicateKey = result.value.replace(/^http:\/\//, 'https://').replace(/#.*$/, '');
        if (seen.has(duplicateKey)) error = 'You already added this link';
        else seen.add(duplicateKey);
      }
      values.push(result.value);
      errors.push(error);
    });
    return { values: values, errors: errors };
  }

  function validateBrief(raw) {
    var value = clean(raw);
    var count = length(value);
    // Match complete URLs first, so domains in their paths are not counted twice.
    var urls = value.match(/(?:https?:\/\/|www\.)[^\s<>]+|(?<![\p{L}\p{N}_@.])(?:[\p{L}\p{N}](?:[\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+(?:[\p{L}]{2,63})(?:[\/:?#][^\s<>]*)?/giu) || [];
    return { value: value, error: count > 1000 ? BRIEF_ERROR : urls.length > 3 ? 'Keep it to 3 links in your project notes' : '', count: count };
  }

  function validateFile(file) {
    if (!file) return '';
    if (!/\.(?:pdf|key|keynote|pptx)$/i.test(String(file.name || ''))) return 'Use a PDF, Keynote or PowerPoint file';
    if (!Number.isFinite(file.size) || file.size < 0 || file.size > 20 * 1024 * 1024) return 'Keep your file at 20 MB or less';
    return '';
  }

  function isSpam(name, brief) {
    var text = clean(name) + ' ' + clean(brief);
    return /[<>]|\bseo\s+services\b|\bbacklinks?\b|\bcasinos?\b/i.test(text);
  }

  function dateKey(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }

  function eligibleDate(key, now) {
    if (typeof key !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
    var parts = key.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    if (dateKey(date) !== key || date.getDay() === 0 || date.getDay() === 6) return false;
    now = now || new Date();
    if (!(now instanceof Date) || Number.isNaN(now.getTime())) return false;
    var first = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 12);
    var last = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30, 12);
    return date >= first && date <= last;
  }

  return { validateName: validateName, validateEmail: validateEmail, validateTelegram: validateTelegram, validateLinks: validateLinks, validateBrief: validateBrief, validateFile: validateFile, isSpam: isSpam, dateKey: dateKey, eligibleDate: eligibleDate };
});
