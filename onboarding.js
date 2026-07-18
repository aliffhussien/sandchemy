// Sandchemy — Phase 7d: first-run onboarding.
//
// Deliberately lightweight, per PLAN.md's own priority order (no leak >
// easy maintain > fun > fancy): a short, dismissible, localStorage-gated
// sequence of 2-3 callouts pointing at the palette, the canvas, and the
// Discovery Journal in turn, ending by surfacing 7b's own '?' cheatsheet
// as the "learn more" exit — not a separate help system, just a pointer
// to the one that already exists. Zero engine files touched; this only
// ever reads game.js/lab.js/shortcuts.js's existing DOM elements and calls
// their existing buttons, the same "call the same function a button
// already calls" principle 7b's shortcuts.js established.
(function () {
  const STORAGE_KEY = 'sandchemy.onboarding_seen';
  if (localStorage.getItem(STORAGE_KEY) === '1') return;

  const steps = [
    {
      target: '#palette',
      title: '① Pick an element',
      body: 'Choose what to pour — Sand, Water, Fire, Lava, and dozens more.'
    },
    {
      target: '.canvas-wrap',
      title: '② Paint it here',
      body: 'Click and drag on the canvas to pour your chosen element.'
    },
    {
      target: '.journal',
      title: '③ Discoveries log automatically',
      body: 'Combine elements and new discoveries appear here on their own — nothing to write down.',
      last: true
    }
  ];

  let index = 0;
  let backdrop, card, highlighted;

  function clearHighlight() {
    if (highlighted) {
      highlighted.classList.remove('onboarding-highlight');
      highlighted = null;
    }
  }

  function finish() {
    localStorage.setItem(STORAGE_KEY, '1');
    clearHighlight();
    if (backdrop) backdrop.remove();
    if (card) card.remove();
  }

  function positionCard(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    let top = rect.bottom + 12 + window.scrollY;
    let left = rect.left + rect.width / 2 - cardRect.width / 2 + window.scrollX;
    // Clamp so the card never runs off-screen on narrow viewports — the
    // same "checked, not assumed" discipline 7c's mobile pass used.
    const maxLeft = window.scrollX + document.documentElement.clientWidth - cardRect.width - 12;
    left = Math.max(window.scrollX + 12, Math.min(left, maxLeft));
    // If the target is low enough that the card would run off the bottom
    // (e.g. the Journal on a short viewport), place the card above instead.
    if (top + cardRect.height > window.scrollY + window.innerHeight - 12) {
      top = rect.top + window.scrollY - cardRect.height - 12;
    }
    card.style.top = top + 'px';
    card.style.left = left + 'px';
  }

  function renderStep() {
    clearHighlight();
    const step = steps[index];
    const targetEl = document.querySelector(step.target);
    if (!targetEl) { finish(); return; } // defensive: never get stuck if a selector ever goes stale

    targetEl.classList.add('onboarding-highlight');
    highlighted = targetEl;

    card.innerHTML =
      '<div class="onboarding-title">' + step.title + '</div>' +
      '<div class="onboarding-body">' + step.body + '</div>' +
      (step.last ? '<button id="onboardingShortcutsBtn" class="small-btn">⌨️ Show keyboard shortcuts</button>' : '') +
      '<div class="onboarding-footer">' +
        '<div class="onboarding-dots">' + steps.map((_, i) => '<span class="dot' + (i === index ? ' active' : '') + '"></span>').join('') + '</div>' +
        '<div class="onboarding-actions">' +
          (index > 0 ? '<button id="onboardingSkip" class="small-btn">Skip</button>' : '<button id="onboardingSkip" class="small-btn">Skip</button>') +
          '<button id="onboardingNext" class="primary-btn small-btn">' + (step.last ? 'Got it' : 'Next') + '</button>' +
        '</div>' +
      '</div>';

    positionCard(targetEl);
    targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });

    document.getElementById('onboardingSkip').addEventListener('click', finish);
    document.getElementById('onboardingNext').addEventListener('click', () => {
      if (step.last) { finish(); return; }
      index += 1;
      renderStep();
    });
    if (step.last) {
      const shortcutsShortcut = document.getElementById('onboardingShortcutsBtn');
      shortcutsShortcut.addEventListener('click', () => {
        finish();
        // Reuse 7b's own Shortcuts button rather than reimplementing the
        // cheatsheet toggle — same "click the real button" pattern as
        // shortcuts.js itself.
        const realShortcutsBtn = document.getElementById('shortcutsBtn');
        if (realShortcutsBtn) realShortcutsBtn.click();
      });
    }
  }

  function start() {
    backdrop = document.createElement('div');
    backdrop.id = 'onboardingBackdrop';
    card = document.createElement('div');
    card.id = 'onboardingCard';
    document.body.appendChild(backdrop);
    document.body.appendChild(card);
    renderStep();
    window.addEventListener('resize', () => {
      const step = steps[index];
      const targetEl = document.querySelector(step.target);
      if (targetEl && card) positionCard(targetEl);
    });
  }

  // A brief delay lets the page's own layout (palette build, journal
  // render) settle first, so the very first tooltip isn't measured against
  // an element that's about to shift.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 400));
  } else {
    setTimeout(start, 400);
  }
})();
