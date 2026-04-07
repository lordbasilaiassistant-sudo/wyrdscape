// ============================================================
// Areas.js — Hand-crafted Wyrdscape world map
// ============================================================
// Defines a 60x60 tile world with: starter town (NW),
// cow field (NE), tree grove (SW), goblin camp (SE),
// north-south river through the middle and a bridge.
// ============================================================

import { WORLD_SIZE, TILE_TYPES } from './Terrain.js';

// ------------------------------------------------------------
// defineWorld()
//   returns { tiles, spawns, spawnPoint }
//   tiles is tiles[z][x] — a TILE_TYPES string
// ------------------------------------------------------------
export function defineWorld() {
  // Initialize all-grass
  const tiles = [];
  for (let z = 0; z < WORLD_SIZE; z++) {
    const row = [];
    for (let x = 0; x < WORLD_SIZE; x++) {
      row.push(TILE_TYPES.GRASS);
    }
    tiles.push(row);
  }

  const setTile = (x, z, t) => {
    if (x < 0 || z < 0 || x >= WORLD_SIZE || z >= WORLD_SIZE) return;
    tiles[z][x] = t;
  };
  const fillRect = (x1, z1, x2, z2, t) => {
    for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) setTile(x, z, t);
    }
  };

  // ----------------------------------------------------------
  // RIVER — runs north-south through the middle, columns 25-28
  // (the bridge will punch through it later)
  // ----------------------------------------------------------
  fillRect(25, 0, 28, WORLD_SIZE - 1, TILE_TYPES.WATER);

  // ----------------------------------------------------------
  // STARTER TOWN (Lumbridge-style) — NW corner, x=5..15, z=5..15
  // ----------------------------------------------------------
  // Base dirt path platform
  fillRect(5, 5, 15, 15, TILE_TYPES.DIRT);
  // Two wooden buildings — quest hall and bank-ish structure
  fillRect(6, 6, 9, 9, TILE_TYPES.WOOD_FLOOR);   // building #1
  fillRect(11, 6, 14, 9, TILE_TYPES.WOOD_FLOOR); // building #2
  fillRect(7, 11, 13, 14, TILE_TYPES.WOOD_FLOOR);// long hall
  // Stone plaza in front (PATH_STONE — the smoothed paving look)
  fillRect(9, 10, 11, 10, TILE_TYPES.PATH_STONE);

  // ----------------------------------------------------------
  // COW FIELD — NE, x=35..50, z=5..20
  // ----------------------------------------------------------
  // Already grass; we just put trees on the perimeter as a fence
  // and place cow + chicken spawns inside.
  // ----------------------------------------------------------
  // GOBLIN CAMP — SE, x=40..55, z=40..55
  // ----------------------------------------------------------
  fillRect(40, 40, 55, 55, TILE_TYPES.DIRT);
  // Sprinkle stone deterministically (no Math.random — repeatable layout)
  for (let z = 40; z <= 55; z++) {
    for (let x = 40; x <= 55; x++) {
      // simple deterministic hash
      const h = ((x * 73856093) ^ (z * 19349663)) >>> 0;
      if ((h % 100) < 22) setTile(x, z, TILE_TYPES.STONE);
    }
  }

  // ----------------------------------------------------------
  // BRIDGE — wood floor across the river at z=30
  // The river is x=25..28, so bridge spans those four tiles.
  // Spec says "3 WOOD_FLOOR tiles at z=30" — we honor the count
  // by using 3 of the 4 river columns and leaving column 28 as
  // water (a stepping-stone style 3-tile bridge).
  // ----------------------------------------------------------
  setTile(25, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(26, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(27, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(28, 30, TILE_TYPES.WOOD_FLOOR); // include column 28 too so the bridge spans the full river
  // Approach tiles either side
  setTile(24, 30, TILE_TYPES.DIRT);
  setTile(29, 30, TILE_TYPES.DIRT);

  // ----------------------------------------------------------
  // PATH_STONE connecting all regions (the iconic smoothed
  // gray paving — the look of the OSRS Grand Exchange tiles)
  // ----------------------------------------------------------
  // Town → bridge (east along z=12, then south to z=30, then east over bridge)
  for (let x = 15; x <= 24; x++) setTile(x, 12, TILE_TYPES.PATH_STONE);
  for (let z = 12; z <= 30; z++) setTile(24, z, TILE_TYPES.PATH_STONE);
  // After bridge → continue east into cow field & south to goblin camp
  for (let z = 12; z <= 30; z++) setTile(29, z, TILE_TYPES.PATH_STONE);
  for (let x = 29; x <= 40; x++) setTile(x, 12, TILE_TYPES.PATH_STONE); // to cow field
  for (let x = 29; x <= 40; x++) setTile(x, 40, TILE_TYPES.PATH_STONE); // to goblin camp
  for (let z = 30; z <= 40; z++) setTile(40, z, TILE_TYPES.PATH_STONE);

  // Town → tree grove (south along x=12)
  for (let z = 15; z <= 35; z++) setTile(12, z, TILE_TYPES.PATH_STONE);
  for (let x = 12; x <= 20; x++) setTile(x, 35, TILE_TYPES.PATH_STONE);

  // Make sure the bridge planks weren't overwritten by the path logic above
  setTile(25, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(26, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(27, 30, TILE_TYPES.WOOD_FLOOR);
  setTile(28, 30, TILE_TYPES.WOOD_FLOOR);

  // ----------------------------------------------------------
  // SPAWNS
  // ----------------------------------------------------------
  const spawns = [];

  // ---- Quest-giver NPC inside the town hall ----
  spawns.push({ x: 10, z: 12, type: 'npc', npcId: 'questGiverHans' });

  // ---- Ambient NPC spawns to make the town feel populated ----
  // (lore-writer is defining these IDs; the world just places them
  // in plausible spots — plaza, hall doorways, building corners)
  spawns.push({ x: 9,  z: 11, type: 'npc', npcId: 'ambientGuard'    }); // plaza guard
  spawns.push({ x: 11, z: 11, type: 'npc', npcId: 'ambientMerchant' }); // plaza merchant
  spawns.push({ x: 8,  z: 13, type: 'npc', npcId: 'ambientFarmer'   }); // walking near hall
  spawns.push({ x: 13, z: 7,  type: 'npc', npcId: 'ambientBanker'   }); // building #2 doorway
  spawns.push({ x: 7,  z: 7,  type: 'npc', npcId: 'ambientPriest'   }); // building #1 doorway

  // ---- Cow field: trees as fence + cows + chickens ----
  // Tree fence around x=35..50, z=5..20 perimeter (sparse).
  const cowFenceTrees = [
    // top edge (z=5)
    [35, 5], [37, 5], [39, 5], [41, 5], [43, 5], [45, 5], [47, 5], [49, 5],
    // bottom edge (z=20)
    [35, 20], [37, 20], [39, 20], [41, 20], [43, 20], [45, 20], [47, 20], [49, 20],
    // left edge (x=35)
    [35, 7], [35, 9], [35, 11], [35, 13], [35, 15], [35, 17],
    // right edge (x=50)
    [50, 7], [50, 9], [50, 11], [50, 13], [50, 15], [50, 17],
  ];
  for (const [x, z] of cowFenceTrees) {
    spawns.push({ x, z, type: 'tree' });
  }
  // Cows (6) inside the field
  const cowPositions = [
    [38, 8], [42, 9], [45, 11], [40, 14], [44, 16], [47, 13],
  ];
  for (const [x, z] of cowPositions) {
    spawns.push({ x, z, type: 'cow' });
  }
  // Chickens (4)
  const chickenPositions = [[37, 12], [41, 17], [46, 8], [48, 18]];
  for (const [x, z] of chickenPositions) {
    spawns.push({ x, z, type: 'chicken' });
  }

  // ---- Tree grove (SW): 18 tree spawns ----
  // Mostly normal trees, a few oak trees mixed in for variety.
  const groveTrees = [
    [6, 36], [8, 38], [5, 40], [9, 42], [7, 44], [11, 36],
    [13, 39], [15, 41], [17, 37], [19, 43], [10, 46], [14, 47],
    [6, 48], [12, 49], [16, 45], [18, 48], [8, 50], [20, 38],
  ];
  let oakCounter = 0;
  for (const [x, z] of groveTrees) {
    // Every 6th is an oak
    const type = (oakCounter++ % 6 === 5) ? 'oakTree' : 'tree';
    spawns.push({ x, z, type });
  }

  // ---- Goblin camp (SE): 5 goblins ----
  const goblinPositions = [
    [44, 44], [48, 46], [46, 50], [52, 48], [50, 53],
  ];
  for (const [x, z] of goblinPositions) {
    spawns.push({ x, z, type: 'goblin' });
  }

  // ----------------------------------------------------------
  // Spawn point: middle of starter town
  // ----------------------------------------------------------
  const spawnPoint = { x: 12, z: 12 };

  return { tiles, spawns, spawnPoint };
}
