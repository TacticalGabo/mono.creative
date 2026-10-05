(function () {
  'use strict';

  const loadedAt = Date.now();
  const timeOptions = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  function init(form) {
    const rules = window.MonoContactRules;
    const testing = window.MONO_CONTACT_CONFIG?.testing === true;
    if (testing) form.noValidate = true;
    const find = (selector) => form.querySelector(selector);
    const all = (selector) => Array.from(form.querySelectorAll(selector));
    const state = { step: 1, date: '', time: '', skip: false, busy: false, sent: false };
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Lima';
    const today = new Date();
    const first = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 12);
    const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30, 12);
    let month = new Date(first.getFullYear(), first.getMonth(), 1, 12);
    let nextLinkId = 2;
    const requestId = window.crypto?.randomUUID?.() || 'lead-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    const cta = find('#form-cta');
    const feedback = find('#submit-feedback');

    function icons() {
      if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }

    function setError(input, message, container, errorNode) {
      input.setAttribute('aria-invalid', String(Boolean(message)));
      container.classList.toggle('is-invalid', Boolean(message));
      errorNode.textContent = message;
    }

    function validateField(id) {
      const input = find('#' + id);
      const validators = { name: rules.validateName, email: rules.validateEmail, telegram: rules.validateTelegram, brief: rules.validateBrief };
      const result = validators[id](input.value);
      input.value = result.value;
      if ((id === 'name' || id === 'brief') && rules.isSpam(id === 'name' ? input.value : '', id === 'brief' ? input.value : '')) {
        result.error = id === 'name' ? 'Just your name is fine' : 'Please keep this about your project, without HTML or promotions';
      }
      setError(input, result.error, input.closest('[data-field]'), find('#' + id + '-error'));
      if (id === 'email') {
        const suggestion = find('#email-suggestion');
        suggestion.hidden = !result.suggestion || Boolean(result.error);
        suggestion.textContent = result.suggestion ? 'Did you mean ' + result.suggestion + '?' : '';
        suggestion.title = suggestion.textContent;
        suggestion.dataset.value = result.suggestion || '';
      }
      return result;
    }

    function validateServices() {
      const services = all('[name="services"]:checked').map((input) => input.value);
      const invalid = !services.length;
      find('#services-field').classList.toggle('is-invalid', invalid);
      find('#services-field').setAttribute('aria-invalid', String(invalid));
      find('#services-error').textContent = invalid ? "Pick at least one, or 'Not sure yet'" : '';
      return services;
    }

    function validateLinks() {
      const inputs = all('[name="links"]');
      const result = rules.validateLinks(inputs.map((input) => input.value));
      inputs.forEach((input, i) => {
        input.value = result.values[i];
        setError(input, result.errors[i], input.closest('[data-link-row]'), find('#' + input.id + '-error'));
      });
      return result;
    }

    function validateAttachment() {
      const message = rules.validateFile(find('#deck').files[0]);
      find('#file-error').textContent = message;
      find('#deck').setAttribute('aria-invalid', String(Boolean(message)));
      return message;
    }

    function validateProject() {
      const services = validateServices();
      const results = ['name', 'email', 'telegram', 'brief'].map(validateField);
      const links = validateLinks();
      const fileError = validateAttachment();
      const valid = services.length && results.every((result) => !result.error) && links.errors.every((error) => !error) && !fileError;
      if (!valid) {
        if (state.step !== 1) setStep(1, false);
        const target = !services.length ? find('[name="services"]') : find('input[aria-invalid="true"], textarea[aria-invalid="true"]');
        if (target) {
          const focusTarget = target.id === 'deck' ? find('#attach-deck') : target;
          focusTarget.focus();
        }
      }
      return Boolean(valid);
    }

    function setStep(step, focus = true) {
      state.step = step;
      all('[data-step]').forEach((panel) => {
        const inactive = Number(panel.dataset.step) !== step;
        panel.hidden = inactive;
        panel.inert = inactive;
        panel.setAttribute('aria-hidden', String(inactive));
      });
      all('[data-progress]').forEach((item) => {
        const active = Number(item.dataset.progress) === step;
        item.classList.toggle('is-current', active);
        item.classList.toggle('is-complete', Number(item.dataset.progress) < step);
        if (active) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
      find('#back-step').hidden = step === 1;
      find('#cta-label').textContent = step === 1 ? "LET'S CONNECT" : 'SEND MY BRIEF';
      find('#step-caption').replaceChildren();
      find('#step-caption').hidden = step === 1;
      if (step === 2) find('#step-caption').append('Your next chapter starts here.', document.createElement('br'), "Let's make it a good one.");
      feedback.textContent = '';
      find('#direct-submit').hidden = true;
      if (step === 2) {
        renderCalendar();
        renderTimes();
        if (focus) find('#schedule-title').focus({ preventScroll: true });
      } else if (focus) find('#name').focus({ preventScroll: true });
    }

    function parseDay(key) {
      const [year, monthIndex, day] = key.split('-').map(Number);
      return new Date(year, monthIndex - 1, day, 12);
    }

    function monthKey(date) { return date.getFullYear() * 12 + date.getMonth(); }

    function renderCalendar(focusDay) {
      find('#calendar-month').textContent = month.toLocaleDateString('en', { month: 'long', year: 'numeric' });
      find('#previous-month').disabled = monthKey(month) <= monthKey(first);
      find('#next-month').disabled = monthKey(month) >= monthKey(last);
      const grid = find('#calendar-days');
      const fragment = document.createDocumentFragment();
      const offset = (month.getDay() + 6) % 7;
      const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      let firstEnabled;
      for (let i = 0; i < 42; i += 1) {
        const day = i - offset + 1;
        if (day < 1 || day > days) {
          const blank = document.createElement('span');
          blank.setAttribute('aria-hidden', 'true');
          fragment.append(blank);
          continue;
        }
        const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
        const key = rules.dateKey(date);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'calendar-day';
        button.textContent = String(day);
        button.dataset.date = key;
        button.disabled = !rules.eligibleDate(key);
        button.tabIndex = -1;
        button.setAttribute('aria-label', date.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
        button.setAttribute('aria-pressed', String(state.date === key));
        if (key === rules.dateKey(new Date())) {
          button.classList.add('is-today');
          button.setAttribute('aria-current', 'date');
        }
        if (!button.disabled && !firstEnabled) firstEnabled = button;
        fragment.append(button);
      }
      grid.replaceChildren(fragment);
      const selected = grid.querySelector('[data-date="' + (focusDay || state.date) + '"]:not(:disabled)') || firstEnabled;
      if (selected) {
        selected.tabIndex = 0;
        if (focusDay) selected.focus({ preventScroll: true });
      }
    }

    function renderTimes() {
      const container = find('#time-slots');
      container.replaceChildren();
      timeOptions.forEach((time) => {
        const label = document.createElement('label');
        label.className = 'time-chip';
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'call-time';
        radio.value = time;
        radio.checked = state.time === time;
        radio.disabled = !state.date || state.skip;
        const span = document.createElement('span');
        span.textContent = time;
        label.append(radio, span);
        container.append(label);
      });
      const reference = state.date ? parseDay(state.date) : new Date();
      const zoneName = new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'shortOffset' }).formatToParts(reference).find((part) => part.type === 'timeZoneName').value;
      find('#timezone-label').textContent = 'Your time: ' + timeZone.replace(/_/g, ' ') + ' (' + zoneName + ')';
      find('#skip-call').setAttribute('aria-pressed', String(state.skip));
    }

    function slotData() {
      if (state.skip || !state.date || !state.time) return null;
      const [year, monthIndex, day] = state.date.split('-').map(Number);
      const [hour, minute] = state.time.split(':').map(Number);
      const start = new Date(year, monthIndex - 1, day, hour, minute);
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      }).formatToParts(start).map((part) => [part.type, part.value]));
      return {
        tentative: true, durationMinutes: 30, startsAt: start.toISOString(),
        local: { date: state.date, time: state.time, timeZone },
        lima: { date: parts.year + '-' + parts.month + '-' + parts.day, time: parts.hour + ':' + parts.minute, timeZone: 'America/Lima', utcOffset: '-05:00' }
      };
    }

    function payload() {
      const file = find('#deck').files[0];
      return {
        id: requestId, name: find('#name').value, email: find('#email').value, telegram: find('#telegram').value,
        services: all('[name="services"]:checked').map((input) => input.value),
        links: all('[name="links"]').map((input) => input.value).filter(Boolean),
        brief: find('#brief').value, callSlot: slotData(),
        attachment: file ? { name: file.name, size: file.size, type: file.type } : null,
        website: find('#website').value, loadedAt: new Date(loadedAt).toISOString(), elapsedMs: Date.now() - loadedAt,
        submittedAt: new Date().toISOString(), suspectedSpam: rules.isSpam(find('#name').value, find('#brief').value)
      };
    }

    function offerEmail(data, message) {
      feedback.textContent = message;
      const slot = data.callSlot;
      const body = [
        'Name: ' + data.name, 'Email: ' + data.email, 'Telegram: ' + (data.telegram || '-'),
        'Services: ' + data.services.join(', '),
        '', 'Project:', data.brief || '-', '', 'Links:', ...data.links,
        '', slot ? 'Tentative call: ' + slot.local.date + ' ' + slot.local.time + ' (' + slot.local.timeZone + '), Lima: ' + slot.lima.date + ' ' + slot.lima.time : 'Call: just email me',
        data.attachment ? '\nAttachment to include: ' + data.attachment.name : ''
      ].join('\n');
      const link = find('#direct-submit');
      link.href = 'mailto:hello.monocreative@gmail.com?subject=' + encodeURIComponent('Project enquiry - ' + data.name) + '&body=' + encodeURIComponent(body);
      link.hidden = false;
    }

    async function sendBrief() {
      if (state.busy || state.sent || !validateProject()) return;
      let slotError = '';
      if (!state.skip && state.date && !rules.eligibleDate(state.date)) slotError = 'Pick a weekday in the next 30 days';
      else if (!state.skip && state.date && !timeOptions.includes(state.time)) slotError = 'Pick a time, or choose email instead';
      find('#slot-error').textContent = slotError;
      if (slotError) {
        (find('#time-slots input:not(:disabled)') || find('#skip-call')).focus({ preventScroll: true });
        return;
      }
      const data = payload();
      if (data.website || data.elapsedMs < 3000) return;
      const endpoint = window.MONO_CONTACT_CONFIG?.endpoint;
      if (!endpoint) {
        offerEmail(data, data.attachment ? 'Send your brief by email and include your deck as an attachment.' : 'Send your brief directly to hello.monocreative@gmail.com.');
        form.dispatchEvent(new CustomEvent('mono:contact-ready', { detail: data, bubbles: true }));
        return;
      }
      state.busy = true;
      cta.disabled = true;
      form.setAttribute('aria-busy', 'true');
      find('#cta-label').textContent = 'SENDING';
      feedback.textContent = '';
      find('#direct-submit').hidden = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const controls = all('input, textarea, button');
      const disabledStates = controls.map((control) => control.disabled);
      controls.forEach((control) => { control.disabled = true; });
      try {
        const body = new FormData();
        body.append('payload', JSON.stringify(data));
        const file = find('#deck').files[0];
        if (file) body.append('deck', file, file.name);
        const response = await fetch(endpoint, { method: 'POST', body, signal: controller.signal });
        if (!response.ok) throw new Error('Submission failed');
        state.sent = true;
        find('#cta-label').textContent = 'BRIEF SENT';
        form.dispatchEvent(new CustomEvent('mono:contact-sent', { detail: { id: requestId }, bubbles: true }));
      } catch (_) {
        controls.forEach((control, i) => { control.disabled = disabledStates[i]; });
        cta.disabled = false;
        find('#cta-label').textContent = 'SEND MY BRIEF';
        offerEmail(data, 'Your brief could not be delivered. Try again or send it by email.');
      } finally {
        clearTimeout(timeout);
        state.busy = false;
        form.setAttribute('aria-busy', 'false');
      }
    }

    ['name', 'email', 'telegram', 'brief'].forEach((id) => {
      find('#' + id).addEventListener('blur', () => validateField(id));
    });
    find('#email-suggestion').addEventListener('click', (event) => {
      find('#email').value = event.currentTarget.dataset.value;
      validateField('email');
      find('#email').focus({ preventScroll: true });
    });
    find('#brief').addEventListener('input', (event) => {
      const count = Array.from(event.target.value.trim()).length;
      find('#brief-count').hidden = count < 800;
      find('#brief-count').textContent = count + ' / 1000';
    });
    find('#services-field').addEventListener('change', (event) => {
      const input = event.target;
      if (input.checked) all('[name="services"]').forEach((other) => {
        if (other !== input && (input.value === 'Not sure yet' || other.value === 'Not sure yet')) other.checked = false;
      });
      validateServices();
    });
    find('#services-field').addEventListener('focusout', (event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) validateServices();
    });
    function updateLinkTools() {
      const count = all('[data-link-row]').length;
      find('#add-link').disabled = count >= 5;
      all('.remove-link').forEach((button) => { button.hidden = count === 1; });
    }
    find('#add-link').addEventListener('click', () => {
      if (all('[data-link-row]').length >= 5) return;
      const id = 'link-' + nextLinkId++;
      const row = find('[data-link-row]').cloneNode(true);
      const input = row.querySelector('input');
      input.id = id;
      input.value = '';
      input.setAttribute('aria-invalid', 'false');
      input.setAttribute('aria-describedby', id + '-error');
      row.querySelector('label').htmlFor = id;
      row.querySelector('label').textContent = 'Link ' + id.split('-')[1] + ' (optional)';
      row.querySelector('.field-error').id = id + '-error';
      row.querySelector('.field-error').textContent = '';
      row.querySelector('.remove-link').setAttribute('aria-label', 'Remove link ' + id.split('-')[1]);
      row.classList.remove('is-invalid');
      find('#link-list').append(row);
      updateLinkTools();
      input.focus();
    });
    find('#link-list').addEventListener('focusout', (event) => {
      if (event.target.matches('[name="links"]')) validateLinks();
    });
    find('#link-list').addEventListener('click', (event) => {
      const remove = event.target.closest('.remove-link');
      if (!remove || all('[data-link-row]').length <= 1) return;
      remove.closest('[data-link-row]').remove();
      updateLinkTools();
      validateLinks();
      find('#add-link').focus({ preventScroll: true });
    });
    find('#attach-deck').addEventListener('click', () => find('#deck').click());
    find('#deck').addEventListener('change', () => {
      const file = find('#deck').files[0];
      find('#file-details').hidden = !file;
      find('#file-name').textContent = file ? file.name : '';
      validateAttachment();
    });
    find('#remove-file').addEventListener('click', () => {
      find('#deck').value = '';
      find('#file-details').hidden = true;
      find('#file-name').textContent = '';
      validateAttachment();
      find('#attach-deck').focus({ preventScroll: true });
    });

    find('#previous-month').addEventListener('click', () => {
      if (monthKey(month) > monthKey(first)) { month.setMonth(month.getMonth() - 1); renderCalendar(); }
    });
    find('#next-month').addEventListener('click', () => {
      if (monthKey(month) < monthKey(last)) { month.setMonth(month.getMonth() + 1); renderCalendar(); }
    });
    find('#calendar-days').addEventListener('click', (event) => {
      const button = event.target.closest('[data-date]');
      if (!button || button.disabled) return;
      state.date = button.dataset.date;
      state.skip = false;
      state.time = '';
      find('#slot-error').textContent = '';
      renderCalendar(state.date);
      renderTimes();
    });
    find('#calendar-days').addEventListener('keydown', (event) => {
      const button = event.target.closest('[data-date]');
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!button || !delta) return;
      event.preventDefault();
      const next = parseDay(button.dataset.date);
      next.setDate(next.getDate() + delta);
      const direction = Math.sign(delta);
      while (next >= first && next <= last && !rules.eligibleDate(rules.dateKey(next))) next.setDate(next.getDate() + direction);
      if (next < first || next > last || !rules.eligibleDate(rules.dateKey(next))) return;
      month = new Date(next.getFullYear(), next.getMonth(), 1, 12);
      renderCalendar(rules.dateKey(next));
    });
    find('#time-slots').addEventListener('change', (event) => {
      state.time = event.target.value;
      state.skip = false;
      find('#slot-error').textContent = '';
    });
    find('#skip-call').addEventListener('click', () => {
      state.skip = !state.skip;
      state.date = '';
      state.time = '';
      find('#slot-error').textContent = '';
      renderCalendar();
      renderTimes();
    });
    find('#back-step').addEventListener('click', () => setStep(1));
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (testing) {
        if (state.step === 1) setStep(2);
        else {
          feedback.textContent = 'Test completed. Nothing was sent.';
          find('#direct-submit').hidden = true;
          form.dispatchEvent(new CustomEvent('mono:contact-test', { detail: payload(), bubbles: true }));
        }
        return;
      }
      if (state.busy || state.sent) return;
      if (state.step === 1) { if (validateProject()) setStep(2); }
      else sendBrief();
    });

    document.querySelectorAll('#dc-root .nav-btn, #dc-root .foot-btn').forEach((button) => {
      function moveToForm() {
        form.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
        (state.step === 1 ? find('#name') : find('#schedule-title')).focus({ preventScroll: true });
      }
      button.addEventListener('click', moveToForm);
      button.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); moveToForm(); }
      });
    });
    find('#name').required = true;
    find('#email').required = true;
    icons();
    renderCalendar();
    renderTimes();
    setStep(1, false);
    updateLinkTools();
    form.dataset.ready = 'true';
  }

  // The shared runtime replaces x-dc; bind only to the committed form.
  function boot() {
    const form = document.querySelector('#dc-root #contact-form');
    if (!form || form.dataset.ready || !window.MonoContactRules) return Boolean(form?.dataset.ready);
    init(form);
    return true;
  }
  if (!boot()) {
    const observer = new MutationObserver(() => { if (boot()) observer.disconnect(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
