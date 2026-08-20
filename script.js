const body = document.body;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');
const modal = document.querySelector('[data-modal]');
const modalClose = document.querySelector('[data-close-demo]');
const demoTriggers = document.querySelectorAll('[data-open-demo]');
const demoForm = document.querySelector('.demo-form');
const subscribeForm = document.querySelector('.subscribe-form');
const modalFocusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

function setMenu(open) {
  if (!menuToggle || !siteNav) return;
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  siteNav.classList.toggle('is-open', open);
}

menuToggle?.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});

siteNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

let lastFocusedElement = null;
function setModal(open) {
  if (!modal) return;
  if (open) {
    lastFocusedElement = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    body.classList.add('modal-open');
    window.setTimeout(() => modal.querySelector('input')?.focus(), 40);
  } else {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    body.classList.remove('modal-open');
    lastFocusedElement?.focus?.();
  }
}

demoTriggers.forEach((trigger) => trigger.addEventListener('click', (event) => {
  event.preventDefault();
  track('demo_opened');
  setModal(true);
}));
modalClose?.addEventListener('click', () => setModal(false));
modal?.addEventListener('click', (event) => {
  if (event.target === modal) setModal(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal?.classList.contains('is-open')) setModal(false);
  if (event.key === 'Tab' && modal?.classList.contains('is-open')) {
    const focusable = [...modal.querySelectorAll(modalFocusableSelector)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

function showFeedback(form, message) {
  const feedback = form.querySelector('.form-feedback');
  if (feedback) feedback.textContent = message;
}

demoForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  showFeedback(demoForm, 'Thanks — we’ll be in touch soon.');
  demoForm.reset();
});

subscribeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  showFeedback(subscribeForm, 'You’re on the list.');
  subscribeForm.reset();
});

const assistantData = {
  ziba: {
    avatar: 'Z', label: 'Finance intelligence', title: 'Clarity for the decisions behind the numbers.',
    message: '“Northstar’s margin is narrowing because materials are arriving later than planned. Review the supplier change order and the two unbilled milestones before the next forecast.”',
    source: 'Based on 14 project records, 3 vendor updates, and the current budget.'
  },
  jupiter: {
    avatar: 'J', label: 'Customer & revenue operations', title: 'Keep momentum with the right customer context.',
    message: '“The Alder account has gone quiet after the estimate was sent. There are two open service items and no follow-up scheduled. Draft a check-in for review?”',
    source: 'Based on the account timeline, open work orders, and opportunity stage.'
  },
  atoosa: {
    avatar: 'A', label: 'Workforce operations', title: 'Keep important people workflows moving.',
    message: '“Three employee records are missing information needed for the next payroll review. Start a checklist for HR approval before the run is prepared.”',
    source: 'Based on workforce records, payroll readiness checks, and workspace policy.'
  },
  artemis: {
    avatar: '✦', label: 'Cross-business intelligence', title: 'See the relationship between the signals.',
    message: '“A change in vendor lead times, project margin, and open hiring requests may affect the Northstar delivery window. Review the connected recommendation.”',
    source: 'Based on finance, projects, vendors, and workforce signals across the workspace.'
  }
};

document.querySelectorAll('[data-assistant]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const key = tab.dataset.assistant;
    const data = assistantData[key];
    if (!data) return;
    track('assistant_selected', { assistant: key });
    document.querySelectorAll('.assistant-tab').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelector('[data-assistant-avatar]').textContent = data.avatar;
    document.querySelector('[data-assistant-label]').textContent = data.label;
    document.querySelector('[data-assistant-title]').textContent = data.title;
    document.querySelector('[data-assistant-message]').textContent = data.message;
    document.querySelector('[data-assistant-source]').textContent = data.source;
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

document.querySelectorAll('[data-year]').forEach((item) => { item.textContent = String(new Date().getFullYear()); });

// Privacy-first consent manager. No analytics vendor is loaded by default.
// Configure window.CBSAI_ANALYTICS_ENDPOINT before this script if a first-party
// collector is available; events are sent only after explicit analytics consent.
const consentStorageKey = 'cbsai_privacy_consent_v1';
const consentCookieName = 'cbsai_consent';
const consentBanner = document.querySelector('[data-consent-banner]');
const consentPanel = document.querySelector('[data-consent-panel]');
const consentAnalyticsToggle = document.querySelector('[data-consent-analytics]');
let consentState = { necessary: true, analytics: false, marketing: false };
let lastConsentFocus = null;

function readConsent() {
  try {
    const stored = window.localStorage.getItem(consentStorageKey);
    if (stored) return { ...consentState, ...JSON.parse(stored) };
  } catch (error) {
    // Storage can be unavailable in private browsing; the banner still works.
  }
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${consentCookieName}=`));
  if (!cookie) return null;
  try { return { ...consentState, ...JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) }; } catch (error) { return null; }
}

function writeConsent(nextState) {
  consentState = { necessary: true, analytics: false, marketing: false, ...nextState };
  try { window.localStorage.setItem(consentStorageKey, JSON.stringify(consentState)); } catch (error) { /* Continue with the cookie fallback. */ }
  document.cookie = `${consentCookieName}=${encodeURIComponent(JSON.stringify(consentState))}; Max-Age=31536000; Path=/; SameSite=Lax`;
  document.documentElement.dataset.analyticsConsent = consentState.analytics ? 'granted' : 'denied';
  closeConsentPanel();
  hideConsentBanner();
  if (consentState.analytics) track('page_view', { path: window.location.pathname });
}

function renderConsent() {
  if (consentAnalyticsToggle) consentAnalyticsToggle.checked = consentState.analytics === true;
}

function showConsentBanner() {
  if (!consentBanner) return;
  consentBanner.classList.add('is-visible');
  consentBanner.setAttribute('aria-hidden', 'false');
}

function hideConsentBanner() {
  if (!consentBanner) return;
  consentBanner.classList.remove('is-visible');
  consentBanner.setAttribute('aria-hidden', 'true');
}

function openConsentPanel() {
  if (!consentPanel) return;
  lastConsentFocus = document.activeElement;
  renderConsent();
  consentPanel.classList.add('is-open');
  consentPanel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('consent-open');
  window.setTimeout(() => consentAnalyticsToggle?.focus(), 40);
}

function closeConsentPanel() {
  if (!consentPanel) return;
  consentPanel.classList.remove('is-open');
  consentPanel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('consent-open');
  lastConsentFocus?.focus?.();
  lastConsentFocus = null;
}

function track(eventName, properties = {}) {
  if (!consentState.analytics) return;
  const endpoint = window.CBSAI_ANALYTICS_ENDPOINT;
  if (!endpoint) return;
  const payload = JSON.stringify({ event: eventName, properties, path: window.location.pathname, timestamp: new Date().toISOString() });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
  } else {
    window.fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
  }
}

window.CBSAI = window.CBSAI || {};
window.CBSAI.track = track;

document.querySelectorAll('[data-open-consent], [data-consent-customize]').forEach((trigger) => trigger.addEventListener('click', openConsentPanel));
document.querySelector('[data-consent-accept]')?.addEventListener('click', () => writeConsent({ analytics: true }));
document.querySelector('[data-consent-reject]')?.addEventListener('click', () => writeConsent({ analytics: false, marketing: false }));
document.querySelector('[data-save-consent]')?.addEventListener('click', () => writeConsent({ analytics: consentAnalyticsToggle?.checked === true, marketing: false }));
document.querySelectorAll('[data-close-consent]').forEach((button) => button.addEventListener('click', closeConsentPanel));
consentPanel?.addEventListener('click', (event) => { if (event.target === consentPanel) closeConsentPanel(); });

const existingConsent = readConsent();
if (existingConsent) {
  consentState = { ...consentState, ...existingConsent };
  renderConsent();
  document.documentElement.dataset.analyticsConsent = consentState.analytics ? 'granted' : 'denied';
  if (consentState.analytics) track('page_view', { path: window.location.pathname });
} else {
  // Global Privacy Control is treated as an opt-out for optional tracking.
  consentState.marketing = false;
  showConsentBanner();
}

document.addEventListener('keydown', (event) => {
  if (!consentPanel?.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeConsentPanel();
  if (event.key === 'Tab') {
    const focusable = [...consentPanel.querySelectorAll(modalFocusableSelector)];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
