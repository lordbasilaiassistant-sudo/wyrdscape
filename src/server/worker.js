// =============================================================
// Wyrdscape API — Cloudflare Worker
// =============================================================
// Username-only login + opaque player state persistence.
// Routes:
//   POST /api/claim    body: {username}              -> 200 / 409
//   GET  /api/load?username=X                        -> 200 {state} / 404
//   POST /api/save     body: {username, state}       -> 200 / 404
//   GET  /api/health                                 -> 200 {ok:true}
//
// All responses are JSON. CORS allow-listed for the prod GitHub
// Pages origin and the local dev server.
// =============================================================

const ALLOWED_ORIGINS = new Set([
  'https://lordbasilaiassistant-sudo.github.io',
  'http://localhost:8765',
  'http://127.0.0.1:8765',
]);

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const MAX_STATE_BYTES = 50 * 1024;   // 50 KB

// ----- helpers ------------------------------------------------

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

function badRequest(msg, origin) {
  return json(400, { error: msg }, origin);
}

function serverError(msg, origin) {
  return json(500, { error: msg }, origin);
}

function validUsername(name) {
  return typeof name === 'string' && USERNAME_RE.test(name);
}

// ----- route handlers -----------------------------------------

async function handleHealth(origin) {
  return json(200, { ok: true, service: 'wyrdscape-api' }, origin);
}

async function handleClaim(req, env, origin) {
  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return badRequest('invalid JSON body', origin);
  }
  const username = body && body.username;
  if (!validUsername(username)) {
    return badRequest('username must be 3-20 chars, alphanumeric or underscore', origin);
  }

  const now = Date.now();

  // Try to insert. If username taken, INSERT fails with UNIQUE constraint.
  try {
    const result = await env.DB.prepare(
      'INSERT INTO players (username, state, created_at, updated_at, play_time_seconds) VALUES (?, ?, ?, ?, 0)'
    ).bind(username, '{}', now, now).run();

    if (!result.success) {
      // Could be a uniqueness collision in some D1 builds — fall through to lookup
      const existing = await env.DB.prepare(
        'SELECT username FROM players WHERE username = ?'
      ).bind(username).first();
      if (existing) return json(409, { error: 'username taken' }, origin);
      return serverError('claim failed', origin);
    }

    return json(200, { ok: true, username, created_at: now }, origin);
  } catch (e) {
    // UNIQUE constraint violation -> 409
    const msg = String(e && e.message || e);
    if (msg.includes('UNIQUE') || msg.includes('constraint')) {
      return json(409, { error: 'username taken' }, origin);
    }
    return serverError('claim error: ' + msg, origin);
  }
}

async function handleLoad(req, env, origin) {
  const url = new URL(req.url);
  const username = url.searchParams.get('username');
  if (!validUsername(username)) {
    return badRequest('invalid username', origin);
  }

  try {
    const row = await env.DB.prepare(
      'SELECT state, updated_at, play_time_seconds FROM players WHERE username = ?'
    ).bind(username).first();

    if (!row) return json(404, { error: 'not found' }, origin);

    let state = null;
    try {
      state = JSON.parse(row.state || '{}');
    } catch (_e) {
      state = {};
    }

    return json(200, {
      username,
      state,
      updated_at: row.updated_at,
      play_time_seconds: row.play_time_seconds || 0,
    }, origin);
  } catch (e) {
    return serverError('load error: ' + String(e && e.message || e), origin);
  }
}

async function handleSave(req, env, origin) {
  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return badRequest('invalid JSON body', origin);
  }
  const username = body && body.username;
  if (!validUsername(username)) {
    return badRequest('invalid username', origin);
  }
  if (!body.state || typeof body.state !== 'object') {
    return badRequest('state required', origin);
  }

  let stateText;
  try {
    stateText = JSON.stringify(body.state);
  } catch (_e) {
    return badRequest('state not serializable', origin);
  }
  if (stateText.length > MAX_STATE_BYTES) {
    return badRequest('state exceeds 50KB cap', origin);
  }

  const now = Date.now();

  try {
    // Only update if the username already exists (claim must come first).
    const result = await env.DB.prepare(
      'UPDATE players SET state = ?, updated_at = ? WHERE username = ?'
    ).bind(stateText, now, username).run();

    // D1 returns meta.changes for affected row count
    const changed = result?.meta?.changes ?? result?.changes ?? 0;
    if (changed === 0) {
      return json(404, { error: 'username not claimed — call /api/claim first' }, origin);
    }

    return json(200, { ok: true, updated_at: now }, origin);
  } catch (e) {
    return serverError('save error: ' + String(e && e.message || e), origin);
  }
}

// ----- main fetch handler -------------------------------------

export default {
  async fetch(request, env, _ctx) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    try {
      if (path === '/api/health' && request.method === 'GET') {
        return await handleHealth(origin);
      }
      if (path === '/api/claim' && request.method === 'POST') {
        return await handleClaim(request, env, origin);
      }
      if (path === '/api/load' && request.method === 'GET') {
        return await handleLoad(request, env, origin);
      }
      if (path === '/api/save' && request.method === 'POST') {
        return await handleSave(request, env, origin);
      }
      return json(404, { error: 'not found', path }, origin);
    } catch (e) {
      return serverError('unhandled: ' + String(e && e.message || e), origin);
    }
  },
};
