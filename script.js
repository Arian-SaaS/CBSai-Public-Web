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

function alignHashTarget() {
  const targetId = window.location.hash.slice(1);
  const target = targetId ? document.getElementById(targetId) : null;
  if (!target) return;
  const headerOffset = header?.getBoundingClientRect().height ?? 0;
  const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset - 8;
  window.scrollTo({ top: Math.max(0, targetTop), behavior: 'auto' });
}

window.addEventListener('hashchange', () => window.setTimeout(alignHashTarget, 0));
window.setTimeout(alignHashTarget, 0);
window.addEventListener('load', () => window.setTimeout(alignHashTarget, 0));
document.fonts?.ready.then(() => window.setTimeout(alignHashTarget, 0));

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

document.addEventListener('click', (event) => {
  const target = event.target;
  const trigger = target instanceof Element ? target.closest('[data-open-demo]') : null;
  if (!trigger) return;
  event.preventDefault();
  track('demo_opened');
  setModal(true);
});
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

function showFeedback(form, message, state = '') {
  const feedback = form.querySelector('.form-feedback');
  if (!feedback) return;
  feedback.textContent = message;
  feedback.className = `form-feedback${state ? ` ${state}` : ''}`;
}

async function submitLead(form) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton?.disabled) return;
  const buttonLabel = submitButton?.innerHTML;
  const leadType = form.dataset.leadForm || 'demo';
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.website;

  submitButton?.setAttribute('aria-busy', 'true');
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = leadType === 'newsletter' ? 'Joining…' : 'Sending…';
  }
  showFeedback(form, 'Sending securely…', 'is-pending');

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ type: leadType, ...payload }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'We could not deliver that request.');
    showFeedback(form, leadType === 'newsletter' ? 'You’re on the list — thank you.' : 'Your request is in our queue. We’ll be in touch soon.', 'is-success');
    form.reset();
    track(leadType === 'newsletter' ? 'newsletter_submitted' : 'demo_submitted');
  } catch (error) {
    showFeedback(form, 'We could not send this yet. Please retry or email marketing@cbsai.co.', 'is-error');
  } finally {
    submitButton?.removeAttribute('aria-busy');
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = buttonLabel;
    }
  }
}

document.querySelectorAll('[data-lead-form]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submitLead(form);
  });
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
    avatar: '✦', label: 'Cross-business intelligence', title: 'Understand the relationships across the business.',
    message: '“Northstar is most likely to miss its margin target because vendor lead times increased, materials costs moved above plan, and two approvals remain open. Review the connected recommendation.”',
    source: 'Based on finance, projects, vendors, inventory, workforce, and approval context across the workspace.'
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

const ecosystemData = {
  finance: { readout: 'Finance signal connected', source: 'Ziba · Margin and budget context' },
  customers: { readout: 'Customer signal connected', source: 'Jupiter · Account and service context' },
  people: { readout: 'People signal connected', source: 'Atoosa · Workforce readiness context' },
  vendors: { readout: 'Vendor signal connected', source: 'Jupiter Ops · Supplier and purchasing context' },
  projects: { readout: 'Delivery signal connected', source: 'Project Management Agent · Schedule and cost context' },
  inventory: { readout: 'Inventory signal connected', source: 'Jupiter Ops · Stock and fulfillment context' }
};

const ecosystemReadout = document.querySelector('[data-ecosystem-readout]');
const ecosystemSource = document.querySelector('[data-ecosystem-source]');
document.querySelectorAll('[data-ecosystem-domain]').forEach((node) => {
  node.addEventListener('click', () => {
    const data = ecosystemData[node.dataset.ecosystemDomain];
    if (!data) return;
    document.querySelectorAll('[data-ecosystem-domain]').forEach((item) => {
      const active = item === node;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    if (ecosystemReadout) ecosystemReadout.textContent = data.readout;
    if (ecosystemSource) ecosystemSource.textContent = data.source;
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

/* ── Material & motion pass (Claude, 2026-08-20) ─────────────────────────────
   Cursor-aware card lighting, glow parallax, and stat counters. All three are
   skipped entirely when the visitor prefers reduced motion.                  */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!prefersReducedMotion.matches) {
  // Cursor-aware card lighting — one delegated listener, writes only CSS vars.
  const lightCards = document.querySelectorAll('.platform-card');
  lightCards.forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    }, { passive: true });
  });

  // Glow parallax, rAF-throttled so scrolling stays cheap.
  const glowLayer = document.querySelector('.site-glow-horizon');
  if (glowLayer) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const shift = Math.min(window.scrollY * 0.12, 160);
        glowLayer.style.setProperty('--glow-shift', `${-shift}px`);
        ticking = false;
      });
    }, { passive: true });
  }

  // Count up numeric stats the first time they scroll into view.
  const statNodes = [...document.querySelectorAll('.ecosystem-stats strong')]
    .filter((node) => /^\d+$/.test(node.textContent.trim()));
  if (statNodes.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        instance.unobserve(entry.target);
        const node = entry.target;
        const target = Number(node.textContent.trim());
        const pad = node.textContent.trim().length;
        const started = performance.now();
        const step = (now) => {
          const progress = Math.min((now - started) / 900, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          node.textContent = String(Math.round(target * eased)).padStart(pad, '0');
          if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
      });
    }, { threshold: .6 });
    statNodes.forEach((node) => countObserver.observe(node));
  }
}

/* ── Workflow motion orchestrator (Claude, 2026-08-20) ───────────────────────
   Stamps a --i stagger index on each diagram's children, then adds
   .is-animated when the diagram scrolls into view. The CSS in styles.css owns
   every actual animation; this file only decides index and timing. Skipped
   entirely under prefers-reduced-motion.                                     */
const motionTargets = [
  ['.workflow-rail', '.workflow-steps li'],
  ['.fragmentation-map', '.orbit-node'],
  ['.card-chart-mini', 'i'],
  ['.bar-chart', 'span'],
  ['.kanban-mini', 'i'],
  ['.star-field', 'i'],
  ['.governance-visual', '.governance-point'],
  ['.adoption-steps', 'li'],
];

if (!prefersReducedMotion.matches && 'IntersectionObserver' in window) {
  const motionObserver = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-animated');
      instance.unobserve(entry.target);
    });
    // rootMargin pre-arms the diagram so a fast scroll still triggers it; the
    // low threshold matters for tall visuals that never fit the viewport.
  }, { threshold: .05, rootMargin: '0px 0px 12% 0px' });

  motionTargets.forEach(([containerSelector, childSelector]) => {
    document.querySelectorAll(containerSelector).forEach((container) => {
      container.querySelectorAll(childSelector).forEach((child, index) => {
        child.style.setProperty('--i', String(index));
        // Give drifting nodes their own vector so they don't move in lockstep.
        if (child.classList.contains('orbit-node')) {
          child.style.setProperty('--dx', `${(index % 2 ? 1 : -1) * (3 + index)}px`);
          child.style.setProperty('--dy', `${(index % 3 ? -1 : 1) * (4 + index)}px`);
        }
      });
      motionObserver.observe(container);
    });
  });

  // Re-animate the assistant panel whenever a different assistant is chosen.
  const assistantPanel = document.querySelector('.assistant-panel');
  if (assistantPanel) {
    document.querySelectorAll('[data-assistant]').forEach((tab) => {
      tab.addEventListener('click', () => {
        assistantPanel.classList.remove('is-swapping');
        // Force a reflow so the animation restarts on a repeat selection.
        void assistantPanel.offsetWidth;
        assistantPanel.classList.add('is-swapping');
      });
    });
    assistantPanel.addEventListener('animationend', () => {
      assistantPanel.classList.remove('is-swapping');
    });
  }
}
