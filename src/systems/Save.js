// ============================================================
// Save — localStorage persistence with versioning
// Pure logic, no Three.js dependency (uses localStorage if present)
// ============================================================

export const SAVE_KEY = 'wyrdscape_save_v1';
const SAVE_VERSION = 1;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) {}
  return null;
}

/**
 * Serialize player state to localStorage.
 * @returns true on success, false if storage unavailable / quota exceeded.
 */
export function saveGame(player) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const payload = {
      version: SAVE_VERSION,
      timestamp: Date.now(),
      player,
    };
    storage.setItem(SAVE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Load player state from localStorage.
 * @returns the player object, or null if absent / invalid / version mismatch.
 */
export function loadGame() {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== SAVE_VERSION) return null;
    return payload.player ?? null;
  } catch (e) {
    return null;
  }
}

/** Remove any saved game. Safe no-op if storage unavailable. */
export function clearSave() {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(SAVE_KEY);
    return true;
  } catch (e) {
    return false;
  }
}
