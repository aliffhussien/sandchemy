// Sandchemy — Phase 7b: keyboard shortcuts.
//
// Deliberately thin: exactly one keydown listener plus a lookup table. Every
// binding below fires the EXACT SAME function the matching toolbar button
// already calls (usually literally `.click()` on that button), so this file
// never reimplements game/lab/effects/audio logic — if a button's own
// behavior ever changes, the shortcut automatically inherits the change.
// game.js / effects.js / lab.js / audio.js are not touched at all.

(function () {
  const cheatsheet = document.getElementById('shortcutsModal');
  const closeCheatsheetBtn = document.getElementById('closeShortcutsBtn');
  const shortcutsBtn = document.getElementById('shortcutsBtn');
  const brush = document.getElementById('brush');
  const paletteEl = document.getElementById('palette');
  const labModal = document.getElementById('labModal');
  const closeLabBtn = document.getElementById('closeLabBtn');

  function clickIfPresent(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }

  function toggleCheatsheet() {
    cheatsheet.classList.toggle('hidden');
  }

  function nudgeBrush(delta) {
    const min = Number(brush.min), max = Number(brush.max);
    const next = Math.min(max, Math.max(min, Number(brush.value) + delta));
    if (next === Number(brush.value)) return;
    brush.value = next;
    // game.js listens for the native 'input' event to update brushSize —
    // dispatching one here is calling the exact same code path a real drag
    // of the slider would trigger, not reimplementing the logic.
    brush.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function selectPaletteSlot(index) {
    // 1..9 then 0 map to the first 10 chips, in the same left-to-right
    // order they're drawn in — clicking the chip is exactly what a mouse
    // user does, so currentElement/buildPalette() stay the single source
    // of truth in game.js.
    const chip = paletteEl.children[index];
    if (chip) chip.click();
  }

  // A shortcut must never fire while the player is typing into a form
  // field — most concretely the Element Lab's create-element inputs
  // (typing "L" into the name field shouldn't toggle the Lab) but this
  // guard is intentionally generic, not Lab-specific, so it also covers
  // the world-name/import textareas and any future form field.
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  document.addEventListener('keydown', (e) => {
    // Escape is the one exception to the typing guard below: it's the
    // universal "cancel/close" gesture, never inserts a character, and
    // real users expect it to close a dialog even mid-form (e.g. after
    // typing partway into the Lab's element-name field). Every other key
    // stays fully blocked while typing, per the spec's own example.
    if (e.key === 'Escape') {
      if (!cheatsheet.classList.contains('hidden')) {
        cheatsheet.classList.add('hidden');
      } else if (labModal && !labModal.classList.contains('hidden')) {
        closeLabBtn.click();
      }
      // Both modals hide via a CSS class (opacity/pointer-events), not
      // `display: none`, so a form field focused right before Escape stays
      // the document's activeElement even after the modal visually closes
      // — found by testing this exact flow (type into the Lab's emoji
      // field, hit Escape, then try another shortcut) rather than assumed.
      // Without this blur, every shortcut after closing a modal this way
      // would keep silently hitting the typing guard below and do nothing.
      if (isTypingTarget(document.activeElement)) document.activeElement.blur();
      return;
    }

    if (isTypingTarget(e.target)) return;

    const mod = e.metaKey || e.ctrlKey; // Cmd on macOS, Ctrl elsewhere

    // Undo / Redo — checked before the plain-key switch below since they
    // need the modifier key.
    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      clickIfPresent('undoBtn');
      return;
    }
    if (mod && ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y')) {
      e.preventDefault();
      clickIfPresent('redoBtn');
      return;
    }

    // Every remaining binding is a single bare key with no modifier —
    // ignoring modifier combos here avoids hijacking real browser/OS
    // shortcuts (Cmd+P print, Cmd+L address bar, Cmd+M minimize, etc.).
    if (mod || e.altKey) return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        clickIfPresent('pauseBtn');
        break;
      case '[':
        nudgeBrush(-1);
        break;
      case ']':
        nudgeBrush(1);
        break;
      case '1': case '2': case '3': case '4': case '5':
      case '6': case '7': case '8': case '9':
        selectPaletteSlot(Number(e.key) - 1);
        break;
      case '0':
        selectPaletteSlot(9);
        break;
      case 'e': case 'E':
        clickIfPresent('fxBtn');
        break;
      case 'p': case 'P':
        clickIfPresent('probeBtn');
        break;
      case 'l': case 'L':
        clickIfPresent('labBtn');
        break;
      case 'm': case 'M':
        clickIfPresent('muteBtn');
        break;
      case '?':
        toggleCheatsheet();
        break;
      default:
        return;
    }
  });

  if (shortcutsBtn) shortcutsBtn.addEventListener('click', toggleCheatsheet);
  if (closeCheatsheetBtn) closeCheatsheetBtn.addEventListener('click', toggleCheatsheet);
})();
