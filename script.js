/* ================================================================
   VIBE CODING WORKSHOP — Script
   Handles:
     0. Sound engine (Web Audio API — no external files)
     1. 60-minute session timer + progress bar
     2. Phase accordion (Part 3) — click to expand/collapse
     3. Part 1 lightbulb expand
     4. Part 3 feasibility typewriter + checkbox
     5. Dot navigation synced to scroll
     6. Keyboard arrow / space navigation
   ================================================================ */

// ── 0. SOUND ENGINE ──────────────────────────────────────────────
// All sounds are synthesised via Web Audio API — zero external files.
// AudioContext is created lazily on first user gesture to satisfy
// browser autoplay policies.

let _ctx = null;
function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  return _ctx;
}

/**
 * Core primitive: play one tone segment.
 * @param {number} freq      Start frequency (Hz)
 * @param {number} freqEnd   End frequency (Hz) — set equal to freq for flat tone
 * @param {number} duration  Duration in seconds
 * @param {number} startAt   AudioContext time to begin (ctx().currentTime + offset)
 * @param {'sine'|'square'|'triangle'|'sawtooth'} type
 * @param {number} gain      Peak gain (0–1)
 * @param {number} attack    Attack time (s)
 * @param {number} decay     Decay time (s) — fade to 0 over this period
 */
function tone(freq, freqEnd, duration, startAt, type = 'sine', gain = 0.18, attack = 0.005, decay = null) {
  const ac  = ctx();
  const osc = ac.createOscillator();
  const env = ac.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startAt);
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, startAt + duration);

  const d = decay ?? duration;
  env.gain.setValueAtTime(0, startAt);
  env.gain.linearRampToValueAtTime(gain, startAt + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, startAt + attack + d);

  osc.connect(env);
  env.connect(ac.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
}

const sounds = {
  /** Timer ▶ Start — bright ascending two-note "go!" */
  timerStart() {
    const t = ctx().currentTime;
    tone(440, 440, 0.12, t,        'sine', 0.15);
    tone(660, 660, 0.14, t + 0.10, 'sine', 0.15);
  },

  /** Timer ⏸ Pause — single soft descending blip */
  timerPause() {
    const t = ctx().currentTime;
    tone(520, 360, 0.18, t, 'sine', 0.13);
  },

  /** Timer ↺ Reset — quick low thump */
  timerReset() {
    const t = ctx().currentTime;
    tone(280, 180, 0.15, t, 'sine', 0.16);
  },

  /** Nav dot click — short soft tick */
  navDot() {
    const t = ctx().currentTime;
    tone(900, 900, 0.07, t, 'sine', 0.10, 0.003, 0.06);
  },

  /** Accordion open — bright upward sweep */
  accOpen() {
    const t = ctx().currentTime;
    tone(300, 600, 0.18, t, 'sine', 0.13);
  },

  /** Accordion close — downward sweep */
  accClose() {
    const t = ctx().currentTime;
    tone(600, 300, 0.18, t, 'sine', 0.13);
  },

  /** Lightbulb 💡 reveal — sparkle: two quick stacked pings */
  bulbOpen() {
    const t = ctx().currentTime;
    tone(880,  880,  0.18, t,        'sine', 0.12);
    tone(1320, 1320, 0.20, t + 0.05, 'sine', 0.09);
  },

  /** Lightbulb close — reverse sparkle */
  bulbClose() {
    const t = ctx().currentTime;
    tone(1320, 880, 0.16, t, 'sine', 0.10);
  },

  /** Feasibility checkbox ✓ checked — satisfying "ding" */
  checkOn() {
    const t = ctx().currentTime;
    tone(660,  660,  0.04, t,        'sine', 0.14, 0.003, 0.30);
    tone(1320, 1320, 0.04, t + 0.04, 'sine', 0.09, 0.003, 0.25);
  },

  /** Feasibility checkbox unchecked — soft low pop */
  checkOff() {
    const t = ctx().currentTime;
    tone(220, 180, 0.12, t, 'sine', 0.12);
  },
};

// ── 1. TIMER ─────────────────────────────────────────────────────

const TOTAL = 60 * 60; // 60 minutes in seconds

const elapsedEl   = document.getElementById('elapsed-display');
const remainingEl = document.getElementById('remaining-display');
const fillEl      = document.getElementById('progress-fill');
const btnStart    = document.getElementById('btn-start');
const btnPause    = document.getElementById('btn-pause');
const btnReset    = document.getElementById('btn-reset');
const heroSlide   = document.getElementById('slide-0');

let elapsed   = 0;
let timerId   = null;
let isRunning = false;

function fmt(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderTimer() {
  const pct = Math.min(100, (elapsed / TOTAL) * 100);
  elapsedEl.textContent   = fmt(elapsed);
  remainingEl.textContent = fmt(Math.max(0, TOTAL - elapsed));
  fillEl.style.width      = `${pct}%`;

  // Progress bar colour: yellow → orange → red as session ends
  if (pct < 75)      fillEl.style.background = '#FBBC04';
  else if (pct < 90) fillEl.style.background = '#F5943A';
  else               fillEl.style.background = '#EA4335';
}

function tick() {
  if (elapsed >= TOTAL) { pauseTimer(); return; }
  elapsed++;
  renderTimer();
}

function startTimer() {
  sounds.timerStart();
  heroSlide?.classList.add('hero-started');
  if (isRunning) return;
  isRunning = true;
  timerId   = setInterval(tick, 1000);
  btnStart.disabled = true;
  btnPause.disabled = false;
}

function pauseTimer() {
  sounds.timerPause();
  if (!isRunning) return;
  clearInterval(timerId);
  isRunning = false;
  btnStart.disabled = false;
  btnPause.disabled = true;
}

function resetTimer() {
  sounds.timerReset();
  pauseTimer();
  elapsed = 0;
  renderTimer();
}

btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer(); // initial display


// ── 2. ACCORDION (Part 3 phases) ─────────────────────────────────

const accItems = Array.from(document.querySelectorAll('.acc-item'));

function setAccBodyHeight(item) {
  const body = item.querySelector('.acc-body');
  const inner = item.querySelector('.acc-inner');
  if (!body || !inner || !item.classList.contains('open')) return;
  body.style.maxHeight = inner.scrollHeight + 48 + 'px';
}

/**
 * Open one item: remove [hidden] from body, animate max-height,
 * update aria-expanded, mark item as open.
 */
function openItem(item) {
  const header = item.querySelector('.acc-header');
  const body   = item.querySelector('.acc-body');

  body.removeAttribute('hidden');
  setAccBodyHeight(item);
  item.classList.add('open');
  header.setAttribute('aria-expanded', 'true');
  setAccBodyHeight(item);
}

/**
 * Close one item: collapse max-height to 0, then re-add [hidden]
 * after the CSS transition ends so screen readers ignore it.
 */
function closeItem(item) {
  const header = item.querySelector('.acc-header');
  const body   = item.querySelector('.acc-body');

  body.style.maxHeight = '0';
  item.classList.remove('open');
  header.setAttribute('aria-expanded', 'false');

  body.addEventListener('transitionend', function handler() {
    body.setAttribute('hidden', '');
    body.removeEventListener('transitionend', handler);
  });
}

// Wire up each accordion header
accItems.forEach((item) => {
  const header = item.querySelector('.acc-header');
  const body   = item.querySelector('.acc-body');

  // Ensure bodies start truly hidden
  body.style.maxHeight = '0';

  header.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');

    // Close all items first (one-open-at-a-time behaviour)
    accItems.forEach((other) => {
      if (other !== item && other.classList.contains('open')) closeItem(other);
    });

    if (isOpen) {
      sounds.accClose();
      closeItem(item);
    } else {
      sounds.accOpen();
      openItem(item);
    }
  });
});

if (window.ResizeObserver) {
  const accResizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const item = entry.target.closest('.acc-item');
      if (item?.classList.contains('open')) setAccBodyHeight(item);
    });
  });
  accItems.forEach((item) => {
    const inner = item.querySelector('.acc-inner');
    if (inner) accResizeObserver.observe(inner);
  });
}

window.addEventListener('resize', () => {
  accItems.forEach((item) => {
    if (item.classList.contains('open')) setAccBodyHeight(item);
  });
});


// ── 3. PART 1 — LIGHTBULB EXPAND ─────────────────────────────────

const bulbBtn    = document.getElementById('bulb-btn');
const bulbExpand = document.getElementById('bulb-expand');

bulbBtn?.addEventListener('click', () => {
  const isOpen = bulbExpand.classList.contains('open');
  if (!isOpen) { sounds.bulbOpen(); } else { sounds.bulbClose(); }
  bulbExpand.classList.toggle('open', !isOpen);
  bulbBtn.classList.toggle('active', !isOpen);
  bulbBtn.setAttribute('aria-expanded', String(!isOpen));
  bulbExpand.setAttribute('aria-hidden', String(isOpen));
});


// ── 4. PART 3 — FEASIBILITY TYPEWRITER ───────────────────────────

const Q_TEXT = 'Is it possible without any coding experience?';
const A_TEXT = 'Yes! Everything in Part 2 was built without writing a single line of code.';

/** Type characters into targetEl one by one, then call onDone. */
function typeWriter(targetEl, text, onDone, speed = 32) {
  let i = 0;
  const id = setInterval(() => {
    targetEl.textContent += text[i++];
    if (i >= text.length) { clearInterval(id); onDone?.(); }
  }, speed);
}

let twDone = false;

const twObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting || twDone) return;
    twDone = true; // run only once

    const qEl    = document.getElementById('tw-q');
    const aEl    = document.getElementById('tw-a');
    const aLine  = document.getElementById('tw-a-line');
    const curQ   = document.getElementById('tw-cur-q');
    const curA   = document.getElementById('tw-cur-a');

    // Short delay so user can see the slide settle first
    setTimeout(() => {
      typeWriter(qEl, Q_TEXT, () => {
        curQ.classList.add('done');
        // Reveal A line, then type
        setTimeout(() => {
          aLine.style.visibility = 'visible';
          typeWriter(aEl, A_TEXT, () => curA.classList.add('done'), 28);
        }, 350);
      });
    }, 600);
  });
}, { threshold: 0.4 });

const slide3El = document.getElementById('slide-3');
if (slide3El) twObserver.observe(slide3El);

// Todo checkbox — toggles aria-pressed + green fill on the main box
const feasCheckBtn = document.getElementById('feasibility-check-btn');
const feasBox      = document.getElementById('feasibility-box');

feasCheckBtn?.addEventListener('click', () => {
  const pressed = feasCheckBtn.getAttribute('aria-pressed') === 'true';
  if (!pressed) { sounds.checkOn(); } else { sounds.checkOff(); }
  feasCheckBtn.setAttribute('aria-pressed', String(!pressed));
  feasBox.classList.toggle('checked', !pressed);
});


// ── 5. PHASE D — CHECKLIST ZOOM MODAL ───────────────────────────

const zoomCards        = Array.from(document.querySelectorAll('.check-card-zoom, .path-card-zoom'));
const modalEl          = document.getElementById('checklist-modal');
const modalCloseBtn    = document.getElementById('checklist-modal-close');
const modalContentEl   = document.getElementById('checklist-modal-content');
const modalBackdropEl  = modalEl?.querySelector('[data-close-modal]');

let lastFocusedCard = null;

function openChecklistModal(card) {
  if (!modalEl || !modalContentEl) return;
  lastFocusedCard = card;

  const cloned = card.cloneNode(true);
  cloned.classList.remove('check-card-zoom');
  cloned.classList.remove('path-card-zoom');
  cloned.removeAttribute('tabindex');
  cloned.removeAttribute('role');
  cloned.removeAttribute('aria-haspopup');
  cloned.removeAttribute('aria-label');

  const titleEl = cloned.querySelector('.check-header strong, h4, strong');
  if (titleEl) {
    titleEl.id = 'checklist-modal-title';
  }

  modalContentEl.innerHTML = '';
  modalContentEl.appendChild(cloned);
  modalEl.removeAttribute('hidden');
  document.body.style.overflow = 'hidden';
  modalCloseBtn?.focus();
}

function closeChecklistModal() {
  if (!modalEl) return;
  modalEl.setAttribute('hidden', '');
  if (modalContentEl) modalContentEl.innerHTML = '';
  document.body.style.overflow = '';
  lastFocusedCard?.focus();
}

zoomCards.forEach((card) => {
  card.addEventListener('click', () => openChecklistModal(card));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openChecklistModal(card);
    }
  });
});

modalCloseBtn?.addEventListener('click', closeChecklistModal);
modalBackdropEl?.addEventListener('click', closeChecklistModal);

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || modalEl?.hasAttribute('hidden')) return;
  closeChecklistModal();
});


// ── 5B. PHASE B — PROMPT STEP REVEAL ─────────────────────────────

const promptStepToggles = Array.from(document.querySelectorAll('.prompt-step-toggle'));

promptStepToggles.forEach((toggleBtn) => {
  const promptStep = toggleBtn.closest('.prompt-step');
  const body = promptStep?.querySelector('.prompt-step-body');
  if (!body) return;

  toggleBtn.addEventListener('click', () => {
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', String(!expanded));
    promptStep.classList.toggle('open', !expanded);
    if (!expanded) {
      body.animate(
        [
          { transform: 'translateY(-8px)', opacity: 0.1 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
    const ownerItem = promptStep.closest('.acc-item');
    if (ownerItem?.classList.contains('open')) {
      requestAnimationFrame(() => setAccBodyHeight(ownerItem));
    }
  });
});


// ── 5C. CLOSING BANNER — CLICK ROCKET TO REVEAL ─────────────────

const closingBanner = document.getElementById('closing-banner');
const closingLaunchBtn = document.getElementById('closing-launch-btn');
const rocketFlight = document.getElementById('rocket-flight');

closingLaunchBtn?.addEventListener('click', () => {
  if (closingBanner?.classList.contains('is-visible')) return;
  closingLaunchBtn.disabled = true;
  if (rocketFlight) {
    const rect = (closingBanner || closingLaunchBtn).getBoundingClientRect();
    rocketFlight.style.left = rect.left + rect.width / 2 + 'px';
    rocketFlight.style.top = rect.top + rect.height / 2 + 'px';
  }
  rocketFlight?.classList.add('active');

  setTimeout(() => {
    closingBanner.classList.add('is-visible');
    const ownerItem = closingBanner.closest('.acc-item');
    if (ownerItem?.classList.contains('open')) setAccBodyHeight(ownerItem);
  }, 1000);
});


// ── 6. DOT NAVIGATION ────────────────────────────────────────────

const dots   = Array.from(document.querySelectorAll('.dot'));
const slides = Array.from(document.querySelectorAll('.slide'));

function goToSlide(index) {
  // scroll-padding-top on <html> ensures the fixed header is accounted for.
  // block:'start' works for all slides; tall Part 3 snaps to its title, then
  // the user scrolls freely through accordion content before Part 4 snaps in.
  slides[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

dots.forEach((dot) => {
  dot.addEventListener('click', () => { sounds.navDot(); goToSlide(parseInt(dot.dataset.index, 10)); });
});


// ── 7. SCROLL SPY — update active dot ───────────────────────────

// IntersectionObserver watches each slide; the one most visible wins.
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const i = slides.indexOf(entry.target);
      if (i === -1) return;
      dots.forEach((d, di) => d.classList.toggle('active', di === i));
    });
  },
  {
    // Trigger when a slide occupies the middle third of the viewport
    rootMargin: '-33% 0px -33% 0px',
    threshold: 0,
  }
);

slides.forEach((s) => spy.observe(s));


// ── 8. KEYBOARD NAVIGATION ───────────────────────────────────────

function currentIndex() {
  // Find the slide closest to the top of the viewport
  const headerH = document.getElementById('progress-header').offsetHeight;
  let best = 0;
  slides.forEach((slide, i) => {
    if (slide.getBoundingClientRect().top <= headerH + 10) best = i;
  });
  return best;
}

document.addEventListener('keydown', (e) => {
  // Don't intercept keys when focus is inside a button or input
  if (['INPUT', 'BUTTON', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  const cur = currentIndex();

  if (['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key)) {
    e.preventDefault();
    sounds.navDot();
    goToSlide(Math.min(cur + 1, slides.length - 1));
  }

  if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) {
    e.preventDefault();
    sounds.navDot();
    goToSlide(Math.max(cur - 1, 0));
  }

  if (e.key === ' ') {
    e.preventDefault();
    sounds.navDot();
    goToSlide(Math.min(cur + 1, slides.length - 1));
  }
});
