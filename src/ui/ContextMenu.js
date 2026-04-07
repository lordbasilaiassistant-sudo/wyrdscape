// =============================================================
// src/ui/ContextMenu.js
// OSRS-style right-click context menu.
//   createContextMenu() -> { element, show, hide, isOpen }
//
// show(x, y, options, header?) — options: array of
//   { label, color: 'yellow'|'cyan'|'orange'|'white'|'red', action: fn }
// Auto-hides on outside click, Escape key, or after action selection.
//
// Owned by: ui-builder
// =============================================================

const VALID_COLORS = new Set(['yellow', 'cyan', 'orange', 'white', 'red']);

export function createContextMenu() {
  const root = document.createElement('div');
  root.className = 'ws-context-menu hidden';

  let open = false;

  function clear() {
    while (root.firstChild) root.removeChild(root.firstChild);
  }

  function hide() {
    if (!open) return;
    open = false;
    root.classList.add('hidden');
    clear();
  }

  function show(x, y, options, header) {
    clear();

    if (header) {
      const h = document.createElement('div');
      h.className = 'ws-context-header';
      h.textContent = header;
      root.appendChild(h);
    }

    if (Array.isArray(options)) {
      for (const opt of options) {
        if (!opt) continue;
        const item = document.createElement('div');
        const color = VALID_COLORS.has(opt.color) ? opt.color : 'white';
        item.className = 'ws-context-item ' + color;
        item.textContent = opt.label || '';
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          try { if (typeof opt.action === 'function') opt.action(); }
          catch (err) { console.error('[ContextMenu] action error', err); }
          hide();
        });
        root.appendChild(item);
      }
    }

    // Always include a Cancel option for OSRS feel
    const cancel = document.createElement('div');
    cancel.className = 'ws-context-item white';
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', (e) => { e.stopPropagation(); hide(); });
    root.appendChild(cancel);

    // Position — clamp inside viewport
    root.classList.remove('hidden');
    open = true;

    // Need to be in DOM to measure
    requestAnimationFrame(() => {
      const r = root.getBoundingClientRect();
      let nx = x;
      let ny = y;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (nx + r.width  > vw - 4) nx = vw - r.width  - 4;
      if (ny + r.height > vh - 4) ny = vh - r.height - 4;
      if (nx < 4) nx = 4;
      if (ny < 4) ny = 4;
      root.style.left = nx + 'px';
      root.style.top  = ny + 'px';
    });
  }

  // Auto-hide on outside click
  function onDocClick(e) {
    if (!open) return;
    if (root.contains(e.target)) return;
    hide();
  }

  // Auto-hide on Escape
  function onKey(e) {
    if (e.key === 'Escape') hide();
  }

  document.addEventListener('mousedown', onDocClick, true);
  document.addEventListener('contextmenu', onDocClick, true);
  document.addEventListener('keydown', onKey);

  // Prevent the menu's own context menu from re-triggering
  root.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); });

  return {
    element: root,
    show,
    hide,
    isOpen: () => open,
  };
}
