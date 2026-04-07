// Wyrdscape monsters — eight starter creatures from passive farm animals to dangerous hobgoblins
// Drops reference item ids from items.js

export const MONSTERS = {
  cow: {
    id: 'cow',
    name: 'Lowland Cow',
    description: 'A heavyset Aldermere milk-cow. Slow, gentle, and entirely indifferent to your existence.',
    hp: 8,
    maxHit: 1,
    attack: 1,
    defence: 1,
    attackSpeed: 4,
    xp: 8,
    aggressive: false,
    aggroRange: 0,
    drops: [
      { item: 'raw_beef',  chance: 1.00, min: 1, max: 1 },
      { item: 'bones',     chance: 1.00, min: 1, max: 1 },
      { item: 'coins',     chance: 0.10, min: 1, max: 3 }
    ],
    respawnMs: 30000,
    modelKey: 'cow'
  },

  chicken: {
    id: 'chicken',
    name: 'Yardfowl',
    description: 'A plump farm bird. Easily startled. Easily killed.',
    hp: 3,
    maxHit: 1,
    attack: 1,
    defence: 1,
    attackSpeed: 4,
    xp: 4,
    aggressive: false,
    aggroRange: 0,
    drops: [
      { item: 'raw_chicken', chance: 1.00, min: 1, max: 1 },
      { item: 'feathers',    chance: 1.00, min: 5, max: 15 },
      { item: 'bones',       chance: 1.00, min: 1, max: 1 }
    ],
    respawnMs: 20000,
    modelKey: 'chicken'
  },

  goblin: {
    id: 'goblin',
    name: 'Marsh Goblin',
    description: 'A short, ash-skinned creature in stitched-together rags. Carries a rusted blade and a great deal of opinions.',
    hp: 12,
    maxHit: 2,
    attack: 4,
    defence: 3,
    attackSpeed: 5,
    xp: 18,
    aggressive: true,
    aggroRange: 4,
    drops: [
      { item: 'bones',         chance: 1.00, min: 1, max: 1 },
      { item: 'coins',         chance: 0.60, min: 2, max: 14 },
      { item: 'goblin_tooth',  chance: 0.30, min: 1, max: 2 },
      { item: 'bronze_cutlass',chance: 0.05, min: 1, max: 1 }
    ],
    respawnMs: 45000,
    modelKey: 'goblin'
  },

  giant_rat: {
    id: 'giant_rat',
    name: 'Cellar Rat',
    description: 'A wet, knee-high rodent with a yellow-toothed grin. Smells like old grain and damp wool.',
    hp: 10,
    maxHit: 2,
    attack: 3,
    defence: 2,
    attackSpeed: 5,
    xp: 12,
    aggressive: true,
    aggroRange: 3,
    drops: [
      { item: 'bones',     chance: 1.00, min: 1, max: 1 },
      { item: 'raw_beef',  chance: 0.10, min: 1, max: 1 }
    ],
    respawnMs: 30000,
    modelKey: 'giant_rat'
  },

  skeleton: {
    id: 'skeleton',
    name: 'Hollow Knight',
    description: 'The bones of a long-dead soldier, animated by the humming of a nearby wyrdstone. Still wearing rusted armor.',
    hp: 28,
    maxHit: 5,
    attack: 12,
    defence: 10,
    attackSpeed: 5,
    xp: 60,
    aggressive: true,
    aggroRange: 5,
    drops: [
      { item: 'big_bones',    chance: 1.00, min: 1, max: 1 },
      { item: 'coins',        chance: 0.70, min: 5, max: 35 },
      { item: 'iron_cutlass', chance: 0.04, min: 1, max: 1 },
      { item: 'wyrdstone_shard', chance: 0.005, min: 1, max: 1 }
    ],
    respawnMs: 60000,
    modelKey: 'skeleton'
  },

  bandit: {
    id: 'bandit',
    name: 'Eastmarch Bandit',
    description: 'A road-thief in patched leathers and a stained scarf. Watches the trade road and waits for stragglers.',
    hp: 32,
    maxHit: 6,
    attack: 14,
    defence: 11,
    attackSpeed: 4,
    xp: 75,
    aggressive: true,
    aggroRange: 5,
    drops: [
      { item: 'bones',         chance: 1.00, min: 1, max: 1 },
      { item: 'coins',         chance: 1.00, min: 10, max: 60 },
      { item: 'bread',         chance: 0.30, min: 1, max: 1 },
      { item: 'leather_jerkin',chance: 0.08, min: 1, max: 1 },
      { item: 'map_fragment',  chance: 0.02, min: 1, max: 1 }
    ],
    respawnMs: 75000,
    modelKey: 'bandit'
  },

  wolf: {
    id: 'wolf',
    name: 'Greyback Wolf',
    description: 'A lean grey wolf from the Northreach. Travels in pairs. Does not bark — only watches.',
    hp: 35,
    maxHit: 6,
    attack: 15,
    defence: 9,
    attackSpeed: 4,
    xp: 80,
    aggressive: true,
    aggroRange: 6,
    drops: [
      { item: 'big_bones', chance: 1.00, min: 1, max: 1 },
      { item: 'wolf_pelt', chance: 0.80, min: 1, max: 1 },
      { item: 'raw_beef',  chance: 0.20, min: 1, max: 1 }
    ],
    respawnMs: 60000,
    modelKey: 'wolf'
  },

  hobgoblin: {
    id: 'hobgoblin',
    name: 'Hob Brute',
    description: 'The larger, meaner cousin of a goblin. Tusked, hunched, and carrying a club the size of a fence post.',
    hp: 55,
    maxHit: 9,
    attack: 22,
    defence: 18,
    attackSpeed: 5,
    xp: 140,
    aggressive: true,
    aggroRange: 5,
    drops: [
      { item: 'big_bones',     chance: 1.00, min: 1, max: 1 },
      { item: 'coins',         chance: 1.00, min: 30, max: 140 },
      { item: 'goblin_tooth',  chance: 0.80, min: 1, max: 4 },
      { item: 'iron_cutlass',  chance: 0.10, min: 1, max: 1 },
      { item: 'bronze_hauberk',chance: 0.06, min: 1, max: 1 },
      { item: 'wyrdstone_shard',chance: 0.01, min: 1, max: 1 }
    ],
    respawnMs: 90000,
    modelKey: 'hobgoblin'
  }
};

// Helper: get monster by id
export function getMonster(id) {
  return MONSTERS[id] || null;
}

// Helper: roll loot from a monster's drop table
export function rollDrops(monsterId) {
  const m = MONSTERS[monsterId];
  if (!m) return [];
  const out = [];
  for (const drop of m.drops) {
    if (Math.random() < drop.chance) {
      const qty = Math.floor(Math.random() * (drop.max - drop.min + 1)) + drop.min;
      out.push({ item: drop.item, quantity: qty });
    }
  }
  return out;
}

export default MONSTERS;
