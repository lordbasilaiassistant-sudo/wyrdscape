// =============================================================
// skillActions.js — gathering/crafting tables for the 4 new skills
//
// Mirrors the pattern used for woodcutting but keeps the data out
// of main.js so content tweaks don't require touching the engine.
//
// Each entry is a "kind" that can be assigned to a spawn (rock
// nodes, fishing spots) or driven directly by an inventory action
// (cook, firemake).
// =============================================================

// -------------------------------------------------------------
// MINING — rock nodes have a single ore type baked in at spawn
// time; tickMine() rolls against the formula below.
// -------------------------------------------------------------
export const ROCK_NODES = {
  copper: {
    ore:       'copper_ore',
    name:      'Copper Rock',
    xp:        17.5,
    levelReq:  1,
    // success chance: 40% at lvl1, rises to ~90% at lvl30
    successChance(level) {
      return Math.min(0.95, 0.4 + (level - 1) * 0.018);
    },
    respawnMs: 8000,
  },
  tin: {
    ore:       'tin_ore',
    name:      'Tin Rock',
    xp:        17.5,
    levelReq:  1,
    successChance(level) {
      return Math.min(0.95, 0.4 + (level - 1) * 0.018);
    },
    respawnMs: 8000,
  },
  iron: {
    ore:       'iron_ore',
    name:      'Iron Rock',
    xp:        35,
    levelReq:  15,
    successChance(level) {
      return Math.min(0.9, 0.25 + (level - 15) * 0.015);
    },
    respawnMs: 12000,
  },
};

// -------------------------------------------------------------
// FISHING — fishing spots don't deplete. Each roll picks a fish
// type weighted by player level (higher level = more salmon).
// -------------------------------------------------------------
export const FISHING_SPOTS = {
  river: {
    name:      'River Fishing Spot',
    levelReq:  1,
    // success: 45% base + scaled by level
    successChance(level) {
      return Math.min(0.95, 0.45 + (level - 1) * 0.015);
    },
    // roll(level) returns { fish, xp } for a successful catch
    roll(level) {
      // Try salmon first (level 30+), then trout (level 20+), then shrimp
      if (level >= 30 && Math.random() < 0.2) {
        return { fish: 'raw_salmon', xp: 70 };
      }
      if (level >= 20 && Math.random() < 0.35) {
        return { fish: 'raw_trout', xp: 50 };
      }
      return { fish: 'raw_shrimp', xp: 10 };
    },
  },
};

// -------------------------------------------------------------
// COOKING — raw → cooked mapping. Used when the player clicks
// "Cook" on a raw food item while adjacent to a fire.
// -------------------------------------------------------------
export const COOKING_RECIPES = {
  raw_beef:    { cooked: 'cooked_beef',    xp: 30, levelReq: 1,  burnLevel: 30 },
  raw_chicken: { cooked: 'cooked_chicken', xp: 30, levelReq: 1,  burnLevel: 25 },
  raw_shrimp:  { cooked: 'cooked_shrimp',  xp: 30, levelReq: 1,  burnLevel: 20 },
  raw_trout:   { cooked: 'cooked_trout',   xp: 70, levelReq: 15, burnLevel: 40 },
  raw_salmon:  { cooked: 'cooked_salmon',  xp: 90, levelReq: 25, burnLevel: 55 },
};

// Burn chance: 50% at levelReq, decays to 0 at burnLevel.
export function cookingBurnChance(recipe, level) {
  if (level >= recipe.burnLevel) return 0;
  if (level <= recipe.levelReq)  return 0.5;
  const span = recipe.burnLevel - recipe.levelReq;
  const gone = level - recipe.levelReq;
  return Math.max(0, 0.5 * (1 - gone / span));
}

// -------------------------------------------------------------
// FIREMAKING — which logs can be lit, xp per attempt.
// -------------------------------------------------------------
export const FIREMAKING_LOGS = {
  logs:        { xp: 40, levelReq: 1,  burnMs: 60000 },
  oak_logs:    { xp: 60, levelReq: 15, burnMs: 75000 },
  willow_logs: { xp: 90, levelReq: 30, burnMs: 90000 },
  maple_logs:  { xp: 135,levelReq: 45, burnMs: 105000 },
};

// Light success chance climbs with level.
export function firemakingSuccessChance(log, level) {
  if (level < log.levelReq) return 0;
  return Math.min(0.95, 0.5 + (level - log.levelReq) * 0.02);
}
