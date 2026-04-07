// =============================================================
// src/ui/Inventory.js
// 4×7 inventory grid panel (28 slots), OSRS-style.
//   createInventoryPanel() -> { element, render, getSlot }
//
//   render(inventory, items?)
//     inventory: array of length 28, each entry either null or
//                { id, qty?, name?, icon?, color? }
//     items:     optional lookup table { [id]: { name, icon, color } }
//                merged on top of the entry data when set.
//
// Click and right-click on slots dispatch CustomEvents bubbling
// from the panel root:
//   inventory:slot-click       { detail: { slot, item } }
//   inventory:slot-right-click { detail: { slot, item, x, y } }
//
// Owned by: ui-builder
// =============================================================

const SLOTS = 28;

function fmtQty(n) {
  if (n == null) return '';
  if (n < 100000) return String(n);
  if (n < 10000000) return Math.floor(n / 1000) + 'K';
  return Math.floor(n / 1000000) + 'M';
}

function qtyClass(n) {
  if (n == null || n < 100000) return '';
  if (n < 10000000) return ' med';
  return ' big';
}

function resolveItem(entry, items) {
  if (!entry) return null;
  let merged = { ...entry };
  if (items && entry.id != null && items[entry.id]) {
    merged = { ...items[entry.id], ...entry };
  }
  return merged;
}

export function createInventoryPanel() {
  const root = document.createElement('div');
  root.className = 'ws-tab-panel ws-inv-panel';

  const heading = document.createElement('h3');
  heading.textContent = 'Inventory';
  root.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'ws-inv-grid';
  root.appendChild(grid);

  const slotEls = [];
  for (let i = 0; i < SLOTS; i++) {
    const slot = document.createElement('div');
    slot.className = 'ws-inv-slot empty';
    slot.dataset.slot = String(i);

    slot.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = slot._item || null;
      root.dispatchEvent(new CustomEvent('inventory:slot-click', {
        bubbles: true,
        detail: { slot: i, item },
      }));
    });

    slot.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const item = slot._item || null;
      root.dispatchEvent(new CustomEvent('inventory:slot-right-click', {
        bubbles: true,
        detail: { slot: i, item, x: e.clientX, y: e.clientY },
      }));
    });

    grid.appendChild(slot);
    slotEls.push(slot);
  }

  function render(inventory, items) {
    const inv = inventory || [];
    for (let i = 0; i < SLOTS; i++) {
      const el = slotEls[i];
      const entry = inv[i];
      const item = resolveItem(entry, items);

      // Reset
      el.innerHTML = '';
      el._item = item;

      if (!item) {
        el.classList.add('empty');
        continue;
      }
      el.classList.remove('empty');

      const icon = document.createElement('div');
      icon.className = 'icon';
      // Use a CSS color square placeholder unless an icon URL is given
      if (item.icon && /^(https?:|data:)/i.test(item.icon)) {
        const img = document.createElement('img');
        img.src = item.icon;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.draggable = false;
        icon.appendChild(img);
      } else {
        icon.style.background = item.color || '#8b6a3b';
        icon.textContent = (item.name || '?').charAt(0).toUpperCase();
      }
      el.appendChild(icon);

      if (item.qty != null && item.qty > 1) {
        const q = document.createElement('div');
        q.className = 'ws-inv-qty' + qtyClass(item.qty);
        q.textContent = fmtQty(item.qty);
        el.appendChild(q);
      }

      // Tooltip via title attr (cheap & functional)
      el.title = item.name ? item.name + (item.qty > 1 ? ' (' + item.qty + ')' : '') : '';
    }
  }

  // Initial empty render
  render([]);

  return {
    element: root,
    render,
    getSlot: (i) => slotEls[i],
  };
}
