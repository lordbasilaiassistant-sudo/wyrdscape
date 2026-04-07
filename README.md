# Wyrdscape

![status](https://img.shields.io/badge/status-alpha-orange)
![engine](https://img.shields.io/badge/engine-three.js-black)
![build](https://img.shields.io/badge/build_step-none-brightgreen)
![license](https://img.shields.io/badge/license-MIT-blue)

> *In the world of **Aldermere**, the Wardens are gone, the wyrdstones hum in the rivers, and a quiet farming village called Hearthmoor has begun to ring its chapel bell at night for no reason anyone can name. You wash up at the village gate with empty pockets and a borrowed sword. The reeve is hiring.*

Wyrdscape is a 3D browser MMORPG built in vanilla JavaScript and Three.js. It runs entirely client-side from any static host — no build step, no installer, no account required. Click to walk. Right-click for everything.

---

## Inspiration

Wyrdscape is a love letter to **Old School RuneScape**, the game that taught a generation what an MMO could feel like when it trusts its players to wander, fail, and find their own stories. Every design decision in this project — the cyan tile click indicator, the right-click context menus, the tabbed sidebar, the parchment dialogue boxes, the chat box ticking away in the corner — exists because OSRS proved those things work and there is no reason to pretend otherwise.

We are not RuneScape. We do not use any RuneScape names, logos, art, music, or content. The world of Aldermere, the village of Hearthmoor, the wyrdstones, the lore, the items, and the monsters are all original to this project. But the **feel** — that low-poly, grounded, click-tile-walk-there feel — is the inheritance, and we wear it openly.

If you have ever loved OSRS, this is for you. If you have never played OSRS, this is also for you, and we suggest you try OSRS afterwards. It is one of the great games.

---

## What it is

- **3D browser MMORPG** rendered with Three.js — runs in any modern browser
- **No build step, no install, no account** — open `index.html` and play
- **Tile-based 3D world** with click-to-move and pathfinding
- **Right-click context menus** for every interactable object
- **Skill-based progression** with XP, levels, and unlocks
- **Combat system** with damage splats, HP bars, and floating XP drops
- **Inventory + equipment** with a 28-slot grid and full body silhouette
- **Quest journal** with multi-stage tracking
- **Save system** that persists locally between sessions
- **Procedural low-poly art** — every model is generated from code, no asset pipeline

---

## How to play

| Input | Action |
|---|---|
| **Left-click ground** | Walk to the clicked tile (cyan indicator marks destination) |
| **Left-click NPC / monster / object** | Default action (talk, attack, chop, etc.) |
| **Right-click anything** | Context menu with all available actions |
| **Arrow keys (← →)** | Rotate camera around player |
| **Arrow keys (↑ ↓)** | Pitch camera up / down |
| **+ / -**  or  **scroll wheel** | Zoom in / out |
| **Tab icons (right panel)** | Switch between Stats, Inventory, Equipment, Quests, etc. |
| **Enter** | Focus chat box |

```
Default actions for common targets:
  ground tile  → walk here
  NPC          → talk-to
  shopkeeper   → trade
  monster      → attack
  tree         → chop
  rock         → mine
  item on floor → take
```

---

## Skills

Wyrdscape launches with the following skills. Each one earns XP independently and unlocks new content as it levels.

| Skill | What it does |
|---|---|
| **Attack** | Determines which weapons you can wield and your accuracy in melee combat |
| **Strength** | Increases your maximum melee damage |
| **Defence** | Lets you wear heavier armor and reduces damage taken |
| **Hitpoints** | Your maximum health pool — passively trains as you fight |
| **Ranged** | Bows, crossbows, and thrown weapons |
| **Prayer** | Combat blessings from the old Wardens — fueled by bones |
| **Woodcutting** | Fell trees for logs (oak, willow, maple, and more) |
| **Fishing** | Catch fish from rivers, lakes, and the cold Greysea |
| **Cooking** | Turn raw ingredients into food that heals more |
| **Firemaking** | Light campfires from logs — useful for cooking on the go |
| **Mining** | Strike ore from rock outcrops |
| **Smithing** | Forge bars and equipment at an anvil |
| **Crafting** | Tan hides, string bows, fletch arrows, and more |

---

## The world

The starter region of Wyrdscape is **Hearthmoor**, a stone-and-thatch farming village on the banks of the Merrow river, two days' walk from the great walls of Tarnholt. It is small. It is quiet. It is too quiet by some measures.

You can find:

- **The Hearthmoor Chapel** — built on an old Warden stone. The bell has begun ringing on its own at night.
- **Reeve Edda Marrowhite** — the village authority. Hires adventurers. Has a personal favor to ask.
- **Old Brann the Pedler** — the only shopkeeper in Hearthmoor. Sells bread, blades, and bandages.
- **Calden Brookside's farm** — south of the village. The cattle farmer has a problem with his herd.
- **The Eastmarch road** — the goblin-haunted trade route east toward Tarnholt. Bandits work the bends.
- **The South Wheat Field** — chickens, cows, and the occasional cellar rat.
- **The Old Barrow Hills** — a higher-level area with skeletons, hobgoblins, and worse things.

Beyond Hearthmoor lies the rest of **Aldermere**: the Greybacks in the north, the Ironvale Confederacy in the south, the Free Port of Saltgate on the western coast, and the unclaimed Northreach where no flag flies twice. These are mapped and waiting for future updates.

---

## Tech

- **[Three.js](https://threejs.org/)** for 3D rendering — loaded from CDN, no bundler
- **Vanilla JavaScript** ES modules — no React, no Vue, no framework lock-in
- **HTML overlay UI** — the HUD, sidebar, chat box, and dialogs are real DOM elements layered over the canvas
- **No build step** — clone, open `index.html`, play
- **Runs from any static host** — GitHub Pages, Netlify, S3, your own filesystem

```bash
# Local dev — any static server works
npx serve .
# or
python -m http.server 8000
# then open http://localhost:8000
```

---

## Project structure

```
OSRS/
  index.html              # Entry point — loads main.js
  README.md               # You are here
  OSRS_REFERENCE.md       # Visual goals reference document
  css/                    # UI stylesheets
  src/
    main.js               # Bootstrap & game loop
    engine/               # Three.js scene, lighting, camera
    graphics/             # Procedural models & materials
    world/                # Terrain, areas, pathfinding
    systems/              # Combat, skills, inventory, save
    ui/                   # HUD, sidebar, chat, dialogs
    data/                 # Items, monsters, NPCs, quests, lore
    server/               # Cloudflare Worker + D1 (server-side saves)
```

---

## Server-side saves (V0.1)

Wyrdscape persists player state to a Cloudflare Worker backed by D1 SQLite,
so a player can claim a username and pick up their character from any device.
The frontend degrades gracefully — if the worker is unreachable it falls
back to localStorage and the game keeps working.

### Deploy the API (one-time)

```bash
cd src/server

# 1. Authenticate (opens browser)
wrangler login

# 2. Create the D1 database — copy printed database_id into wrangler.toml
wrangler d1 create wyrdscape

# 3. Apply schema
wrangler d1 execute wyrdscape --remote --file=schema.sql

# 4. Deploy the worker
wrangler deploy
```

After deploy, verify with:

```bash
curl https://wyrdscape-api.lordbasilaiassistant-sudo.workers.dev/api/health
# -> {"ok":true,"service":"wyrdscape-api"}
```

If your subdomain differs, update `WYRDSCAPE_API_URL` in `src/systems/Save.js`.
See `src/server/README.md` for full route docs.

---

## Credits

Wyrdscape was built by the **Anthropic Claude team** (acting as a coordinated multi-agent build) under the direction of [drlor](https://github.com/drlor). Every line of code, every model, every NPC, every blade of grass was produced by AI agents working from a shared design brief.

- **Inspiration**: Old School RuneScape (Jagex Ltd.) — with deep gratitude
- **Engine**: [Three.js](https://threejs.org/) by mrdoob and contributors
- **Build**: Multi-agent Claude team
- **Worldbuilding**: All names, lore, items, and characters are original to Wyrdscape

---

## License

MIT License. Do whatever you want with the code. The world of Aldermere is offered freely to anyone who wants to build on it — write a fan story, make a mod, fork the engine, fork the world. The wyrdstones hum for everyone.
