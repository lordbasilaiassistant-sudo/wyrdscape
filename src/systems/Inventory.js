// ============================================================
// Inventory — 28-slot OSRS-style inventory with stackables
// Pure logic, no Three.js or DOM dependencies
// ============================================================

export const MAX_SLOTS = 28;

/** Starting inventory: bronze sword, bronze axe, 3 cooked beef. */
export function defaultInventory() {
  return [
    { id: 'bronzeSword', qty: 1 },
    { id: 'bronzeAxe',   qty: 1 },
    { id: 'cookedBeef',  qty: 3 },
  ];
}

/**
 * Add an item to the inventory.
 * Stackable items merge into the existing slot; non-stackable items
 * occupy individual slots (one per qty).
 *
 * @param {Array} inv - inventory array (mutated)
 * @param {string} itemId - item id to add
 * @param {number} qty - quantity to add
 * @param {object} items - item definitions keyed by id; items[id].stackable
 * @returns {boolean} true if fully added, false if inventory full (partial adds possible)
 */
export function addItem(inv, itemId, qty, items) {
  if (!inv || !itemId || qty <= 0) return false;
  const def = items?.[itemId];
  const stackable = !!def?.stackable;

  if (stackable) {
    const existing = inv.find((slot) => slot && slot.id === itemId);
    if (existing) {
      existing.qty += qty;
      return true;
    }
    if (inv.length >= MAX_SLOTS) return false;
    inv.push({ id: itemId, qty });
    return true;
  }

  // Non-stackable: one slot per unit
  let added = 0;
  while (added < qty) {
    if (inv.length >= MAX_SLOTS) return false;
    inv.push({ id: itemId, qty: 1 });
    added += 1;
  }
  return true;
}

/**
 * Remove the item at the given slot index. If the slot is a stack > 1,
 * decrement qty; otherwise remove the slot entirely.
 * @returns the removed item descriptor { id, qty: 1 } or null
 */
export function removeItem(inv, slotIdx) {
  if (!inv || slotIdx < 0 || slotIdx >= inv.length) return null;
  const slot = inv[slotIdx];
  if (!slot) return null;
  if (slot.qty > 1) {
    slot.qty -= 1;
    return { id: slot.id, qty: 1 };
  }
  inv.splice(slotIdx, 1);
  return { id: slot.id, qty: 1 };
}

/** Read-only peek at a slot. Returns the slot object or null. */
export function getItemAt(inv, slotIdx) {
  if (!inv || slotIdx < 0 || slotIdx >= inv.length) return null;
  return inv[slotIdx] ?? null;
}
