// ============================================================
// Areas.js — Hearthmoor Village (Wyrdscape world map)
// ============================================================
// A polished 30x30 tile world. One small village in the middle
// with surrounding wilderness:
//   - Hearthmoor Village (center): plaza, well, 5 buildings,
//     ambient NPCs, partial stone walls
//   - North:  Brookside farm (cows + chickens)
//   - East:   river bank with 2 fishing spots + footbridge
//   - South:  tree grove (woodcutting)
//   - West:   rocky hills with mineable rocks + goblin camp
// Roads of stone & dirt connect every region.
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
  // RIVER — east side, runs north-south (columns 25-26)
  // ----------------------------------------------------------
  fillRect(25, 0, 26, WORLD_SIZE - 1, TILE_TYPES.WATER);

  // ----------------------------------------------------------
  // ROCKY HILLS — west strip (columns 0-3), sprinkled stone
  // ----------------------------------------------------------
  for (let z = 0; z < WORLD_SIZE; z++) {
    for (let x = 0; x <= 3; x++) {
      const h = ((x * 73856093) ^ (z * 19349663)) >>> 0;
      if ((h % 100) < 55) setTile(x, z, TILE_TYPES.STONE);
    }
  }

  // ----------------------------------------------------------
  // HEARTHMOOR VILLAGE — center, x=12..22, z=12..22
  // ----------------------------------------------------------
  // Base village ground: dirt with central plaza of stone paving
  fillRect(12, 12, 22, 22, TILE_TYPES.DIRT);

  // Central plaza (PATH_STONE) — 3x3 with the stone well at center
  fillRect(16, 16, 18, 18, TILE_TYPES.PATH_STONE);
  // Stone well in plaza center — represented as a STONE tile
  // (decorative, walkable around but not over)
  setTile(17, 17, TILE_TYPES.STONE);

  // ----- Buildings -------------------------------------------
  // Each building: perimeter = WALL (non-walkable), interior =
  // WOOD_FLOOR (walkable), one south doorway carved out.
  // ----------------------------------------------------------
  const buildPerimeter = (x1, z1, x2, z2, doorX) => {
    for (let z = z1; z <= z2; z++) {
      for (let x = x1; x <= x2; x++) {
        const onPerimeter = (x === x1 || x === x2 || z === z1 || z === z2);
        if (onPerimeter) {
          setTile(x, z, TILE_TYPES.WALL);
        } else {
          setTile(x, z, TILE_TYPES.WOOD_FLOOR);
        }
      }
    }
    // Carve south doorway — one tile of the south edge becomes floor
    setTile(doorX, z2, TILE_TYPES.WOOD_FLOOR);
  };

  // Building #1 — Chapel (NW of plaza)
  // 4 wide, 4 deep, door faces south toward plaza
  buildPerimeter(12, 12, 15, 15, /*doorX=*/14);

  // Building #2 — Bank / Longhall (NE of plaza)
  // 4 wide, 4 deep, door faces south
  buildPerimeter(19, 12, 22, 15, /*doorX=*/20);

  // Building #3 — General Store (SW of plaza)
  // 4 wide, 4 deep, door at top facing plaza (north doorway exception)
  buildPerimeter(12, 19, 15, 22, /*doorX=*/14);
  // Override: also open north side toward plaza
  setTile(14, 19, TILE_TYPES.WOOD_FLOOR);

  // Building #4 — Smithy (SE of plaza)
  buildPerimeter(19, 19, 22, 22, /*doorX=*/20);
  // Smithy has a north opening too (to the plaza)
  setTile(20, 19, TILE_TYPES.WOOD_FLOOR);

  // Building #5 — Inn (south, below plaza, slightly larger)
  // Centered below the plaza, doorway facing the plaza (north side)
  // We use a perimeter with south door, then carve a north door instead.
  buildPerimeter(16, 20, 18, 22, /*doorX=*/17);
  // Open the north side onto the plaza
  setTile(17, 20, TILE_TYPES.WOOD_FLOOR);
  // Re-close the south doorway carved by the helper
  setTile(17, 22, TILE_TYPES.WALL);

  // ----- Partial stone walls bordering the village -----------
  // Top wall (north edge of village), with a gap for the road
  for (let x = 11; x <= 23; x++) {
    if (x === 17) continue;             // gap for the north road
    setTile(x, 11, TILE_TYPES.WALL);
  }
  // Bottom wall (south edge), with a gap for the south road
  for (let x = 11; x <= 23; x++) {
    if (x === 17) continue;             // gap for the south road
    setTile(x, 23, TILE_TYPES.WALL);
  }
  // West wall (left edge), with a gap for the west road
  for (let z = 11; z <= 23; z++) {
    if (z === 17) continue;             // gap for the west road
    setTile(11, z, TILE_TYPES.WALL);
  }
  // East wall (right edge), with a gap for the east road
  for (let z = 11; z <= 23; z++) {
    if (z === 17) continue;             // gap for the east road
    setTile(23, z, TILE_TYPES.WALL);
  }

  // ----------------------------------------------------------
  // ROADS — connect village to all outlying regions
  // ----------------------------------------------------------
  // North road: village gate (17,11) → farm (z=2)
  for (let z = 2; z <= 11; z++) setTile(17, z, TILE_TYPES.PATH_STONE);
  // South road: village gate (17,23) → tree grove (z=28)
  for (let z = 23; z <= 28; z++) setTile(17, z, TILE_TYPES.PATH_STONE);
  // West road: village gate (11,17) → rocky hills / mines (x=4)
  for (let x = 4; x <= 11; x++) setTile(x, 17, TILE_TYPES.PATH_STONE);
  // East road: village gate (23,17) → river bridge (x=27)
  for (let x = 23; x <= 24; x++) setTile(x, 17, TILE_TYPES.PATH_STONE);
  for (let x = 27; x <= 29; x++) setTile(x, 17, TILE_TYPES.PATH_STONE);

  // Make sure plaza connects to all four village gates internally
  // (vertical and horizontal corridors of dirt through the village)
  for (let z = 12; z <= 22; z++) setTile(17, z, TILE_TYPES.DIRT);
  for (let x = 12; x <= 22; x++) setTile(x, 17, TILE_TYPES.DIRT);
  // Re-stamp plaza tiles (they were just overwritten)
  fillRect(16, 16, 18, 18, TILE_TYPES.PATH_STONE);
  setTile(17, 17, TILE_TYPES.STONE); // well

  // ----------------------------------------------------------
  // BRIDGE — wood plank crossing over the river at z=17
  // River is x=25..26, so a 2-tile bridge.
  // ----------------------------------------------------------
  setTile(25, 17, TILE_TYPES.WOOD_FLOOR);
  setTile(26, 17, TILE_TYPES.WOOD_FLOOR);

  // ----------------------------------------------------------
  // BROOKSIDE FARM — north grass field, z=2..10, x=8..22
  // ----------------------------------------------------------
  // Wooden fence using DIRT trim around the farm interior so
  // the area visually reads as enclosed pasture.
  // (Grass underfoot is already in place.)
  // Small dirt patch around the farm gate (north end of road)
  fillRect(16, 2, 18, 3, TILE_TYPES.DIRT);

  // ----------------------------------------------------------
  // TREE GROVE — south, z=24..29, x=4..28
  // ----------------------------------------------------------
  // Sprinkle a little dirt scrub through the grove to make it
  // feel like a forest floor instead of a perfect lawn.
  for (let z = 24; z <= 29; z++) {
    for (let x = 4; x <= 28; x++) {
      // Don't overwrite the south road
      if (x === 17 && z <= 28) continue;
      const h = ((x * 12345 + 67) ^ (z * 89012 + 345)) >>> 0;
      if ((h % 100) < 18) setTile(x, z, TILE_TYPES.DIRT);
    }
  }
  // Re-stamp the south road just in case
  for (let z = 23; z <= 28; z++) setTile(17, z, TILE_TYPES.PATH_STONE);

  // ----------------------------------------------------------
  // GOBLIN CAMP — west, behind a hill (x=0..7, z=22..28)
  // Small dirt clearing among the rocky hills.
  // ----------------------------------------------------------
  fillRect(2, 23, 7, 28, TILE_TYPES.DIRT);

  // ----------------------------------------------------------
  // SPAWNS
  // ----------------------------------------------------------
  const spawns = [];

  // ---- Quest-giver NPC at the village inn ----
  spawns.push({ x: 17, z: 21, type: 'npc', npcId: 'questGiverHans' });

  // ---- Ambient NPCs scattered through the village ----
  // Priest in the chapel
  spawns.push({ x: 14, z: 14, type: 'npc', npcId: 'ambientPriest' });
  // Banker in the bank/longhall
  spawns.push({ x: 20, z: 14, type: 'npc', npcId: 'ambientBanker' });
  // Shopkeeper in the general store
  spawns.push({ x: 14, z: 21, type: 'npc', npcId: 'ambientMerchant' });
  // Smith in the smithy
  spawns.push({ x: 20, z: 21, type: 'npc', npcId: 'ambientSmith' });
  // Innkeeper inside the inn
  spawns.push({ x: 17, z: 22, type: 'npc', npcId: 'ambientInnkeeper' });
  // Guard at the north village gate
  spawns.push({ x: 17, z: 12, type: 'npc', npcId: 'ambientGuard' });
  // Farmer wandering near the plaza
  spawns.push({ x: 18, z: 18, type: 'npc', npcId: 'ambientFarmer' });
  // Kid playing near the well
  spawns.push({ x: 16, z: 18, type: 'npc', npcId: 'ambientKid' });

  // ---- Brookside farm: cows + chickens ----
  // 4 cows in the north grass field
  const cowPositions = [
    [10, 5], [13, 7], [20, 5], [22, 8],
  ];
  for (const [x, z] of cowPositions) {
    spawns.push({ x, z, type: 'cow' });
  }
  // 3 chickens
  const chickenPositions = [[12, 4], [15, 9], [21, 6]];
  for (const [x, z] of chickenPositions) {
    spawns.push({ x, z, type: 'chicken' });
  }

  // ---- Tree grove (south): 12 trees, 3 oaks ----
  const groveTrees = [
    [5, 25],  [7, 27],  [9, 24],  [11, 26],
    [14, 28], [19, 25], [21, 27], [23, 24],
    [24, 28], // east end of grove (just west of the river)
    // The 3 oaks
    [8, 26],  [13, 25], [22, 28],
  ];
  let i = 0;
  for (const [x, z] of groveTrees) {
    // Last 3 entries are the oaks
    const type = (i >= groveTrees.length - 3) ? 'oakTree' : 'tree';
    spawns.push({ x, z, type });
    i++;
  }

  // ---- Rocky hills (west): 4 mineable rocks ----
  const rockPositions = [
    { x: 2, z: 8,  rock: 'copper' },
    { x: 1, z: 12, rock: 'tin' },
    { x: 3, z: 15, rock: 'iron' },
    { x: 2, z: 19, rock: 'copper' },
  ];
  for (const { x, z, rock } of rockPositions) {
    setTile(x, z, TILE_TYPES.DIRT);   // clear the spot for the rock
    spawns.push({ x, z, type: 'rock', rock });
  }

  // ---- Goblin camp (west, tucked in the hills): 4 goblins ----
  const goblinPositions = [
    [3, 24], [5, 25], [4, 27], [6, 26],
  ];
  for (const [x, z] of goblinPositions) {
    spawns.push({ x, z, type: 'goblin' });
  }

  // ---- Fishing spots: 2 on the river east of the village ----
  const fishingPositions = [
    { x: 25, z: 10 },
    { x: 25, z: 22 },
  ];
  for (const { x, z } of fishingPositions) {
    spawns.push({ x, z, type: 'fishingSpot' });
    // Carve a dirt approach tile west of each spot so the player
    // can walk up to the bank to fish.
    setTile(24, z, TILE_TYPES.DIRT);
  }

  // ---- Giant rats: 3 along the east river bank ----
  // Lurking in the damp grass on the far side of the river,
  // away from the bridge. Easy XP for level 1-3 players.
  const giantRatPositions = [
    [27, 8],
    [28, 21],
    [27, 25],
  ];
  for (const [x, z] of giantRatPositions) {
    spawns.push({ x, z, type: 'giant_rat' });
  }

  // ---- Bandits: 2 on the south road exit ----
  // Road thieves waiting on the south trade road past the village
  // gate. Mid-difficulty (level 5-10 players).
  const banditPositions = [
    [17, 26],
    [16, 28],
  ];
  for (const [x, z] of banditPositions) {
    spawns.push({ x, z, type: 'bandit' });
  }

  // ---- Wolves: 2 in the south tree grove ----
  // Greyback wolves stalking the edges of the forest. Spread out
  // east + west of the road so the player meets them on either
  // side of the grove. Mid-tier monster.
  const wolfPositions = [
    [10, 27],
    [24, 26],
  ];
  for (const [x, z] of wolfPositions) {
    spawns.push({ x, z, type: 'wolf' });
  }

  // ----------------------------------------------------------
  // Spawn point: village plaza, just south of the well
  // ----------------------------------------------------------
  const spawnPoint = { x: 17, z: 18 };

  return { tiles, spawns, spawnPoint };
}
