// ============================================================
// Save — localStorage persistence with versioning
// + remote (Cloudflare Worker + D1) sync for V0.1 server saves.
//
// All remote calls degrade gracefully: a server failure NEVER
// breaks the game. We fall back to localStorage and log a warning.
// ============================================================

export const SAVE_KEY = 'wyrdscape_save_v1';
const SAVE_VERSION = 1;

// Cloudflare Worker URL — set after `wrangler deploy`. Update this
// constant if the deployed subdomain differs.
export const WYRDSCAPE_API_URL =
  'https://wyrdscape-api.lordbasilaiassistant-sudo.workers.dev';

// Per-request timeout (ms) so a hung server never blocks gameplay.
const REMOTE_TIMEOUT_MS = 4000;

function getStorage() {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch (e) {}
  return null;
}

// ----- localStorage (existing API, untouched) ----------------

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

// ----- remote (Cloudflare Worker) ----------------------------

/** Fetch with a hard timeout. Returns null on any failure. */
async function fetchWithTimeout(url, options) {
  if (typeof fetch === 'undefined') return null;
  const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
  const timer = ctrl
    ? setTimeout(() => { try { ctrl.abort(); } catch (_e) {} }, REMOTE_TIMEOUT_MS)
    : null;
  try {
    const res = await fetch(url, {
      ...options,
      signal: ctrl ? ctrl.signal : undefined,
    });
    return res;
  } catch (e) {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Attempt to claim a username on the server.
 * @returns { ok: true } | { ok: false, status, error }
 *   status 409 means taken; status 0 means network failure.
 */
export async function claimUsername(username) {
  const url = WYRDSCAPE_API_URL + '/api/claim';
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res) {
    console.warn('[Wyrdscape] claim: network failure, server unreachable');
    return { ok: false, status: 0, error: 'network' };
  }
  if (res.status === 200) {
    return { ok: true };
  }
  let body = null;
  try { body = await res.json(); } catch (_e) {}
  return { ok: false, status: res.status, error: body?.error || 'claim failed' };
}

/**
 * Save player state to the server. Falls back to localStorage on failure.
 * @returns { ok: true, remote: true } if server accepted,
 *          { ok: true, remote: false } if only localStorage succeeded,
 *          { ok: false } if both failed.
 */
export async function saveGameRemote(username, player) {
  // Always write to localStorage as a safety net first.
  const localOk = saveGame(player);

  if (!username) {
    return { ok: localOk, remote: false };
  }

  const url = WYRDSCAPE_API_URL + '/api/save';
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, state: player }),
  });

  if (!res || res.status !== 200) {
    if (res) {
      console.warn('[Wyrdscape] remote save returned ' + res.status + ' — using localStorage');
    } else {
      console.warn('[Wyrdscape] remote save unreachable — using localStorage');
    }
    return { ok: localOk, remote: false };
  }

  return { ok: true, remote: true };
}

/**
 * Load player state from the server. Falls back to localStorage on failure.
 * @returns the player object, or null if not found anywhere.
 */
export async function loadGameRemote(username) {
  if (!username) return loadGame();

  const url = WYRDSCAPE_API_URL + '/api/load?username=' + encodeURIComponent(username);
  const res = await fetchWithTimeout(url, { method: 'GET' });

  if (!res) {
    console.warn('[Wyrdscape] remote load unreachable — using localStorage');
    return loadGame();
  }

  if (res.status === 404) {
    // Brand new account on the server (claimed but never saved).
    return null;
  }

  if (res.status !== 200) {
    console.warn('[Wyrdscape] remote load returned ' + res.status + ' — using localStorage');
    return loadGame();
  }

  let body = null;
  try { body = await res.json(); } catch (_e) {}
  if (!body || !body.state) return loadGame();

  // The server stores opaque state. If the state is empty ({}), prefer
  // local copy if any (preserves a player's pre-account session).
  if (Object.keys(body.state).length === 0) {
    return loadGame();
  }

  return body.state;
}
