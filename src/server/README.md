# Wyrdscape API — Cloudflare Worker + D1

Username-only login + opaque player state persistence for Wyrdscape.
Free tier on Cloudflare Workers + D1 covers everything we need at V0.1.

## Routes

| Method | Path | Body / Query | Response |
|--------|------|--------------|----------|
| GET    | `/api/health`            | —                            | `{ok:true}` |
| POST   | `/api/claim`             | `{username}`                 | 200 / 409 (taken) |
| GET    | `/api/load?username=X`   | —                            | `{state:{...}}` / 404 |
| POST   | `/api/save`              | `{username, state}`          | 200 / 404 (claim first) |

- Username: `^[A-Za-z0-9_]{3,20}$`
- State cap: 50 KB serialized JSON
- CORS: allows `https://lordbasilaiassistant-sudo.github.io` and localhost dev server

## Initial setup (one-time)

```bash
cd src/server

# 1. Authenticate (opens browser)
wrangler login

# 2. Create the D1 database — copy the printed database_id into wrangler.toml
wrangler d1 create wyrdscape

# 3. Apply schema
wrangler d1 execute wyrdscape --remote --file=schema.sql

# 4. Deploy the worker
wrangler deploy
```

After `wrangler deploy`, note the printed worker URL (e.g.
`https://wyrdscape-api.<account-subdomain>.workers.dev`).
If it differs from `https://wyrdscape-api.lordbasilaiassistant-sudo.workers.dev`,
update `WYRDSCAPE_API_URL` in `src/systems/Save.js`.

## Iterate

```bash
wrangler dev      # local dev — exposes the worker on http://localhost:8787
wrangler deploy   # ship to production
```

## Verify

```bash
curl https://wyrdscape-api.lordbasilaiassistant-sudo.workers.dev/api/health
# -> {"ok":true,"service":"wyrdscape-api"}

curl -X POST https://wyrdscape-api.lordbasilaiassistant-sudo.workers.dev/api/claim \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser"}'
# -> {"ok":true,"username":"testuser",...}
```

## Notes

- The frontend degrades gracefully when the worker is unreachable —
  it falls back to localStorage and logs a warning. The game keeps
  working even before the API is deployed.
- State is opaque to the server; this V0.1 trusts the client. We can
  add server-side validation later if cheating becomes a problem.
- D1 free tier: 5 GB storage, 5 million reads/day, 100k writes/day —
  more than enough for V0.1.
