// Wyrdscape items — original names, evocative descriptions
// All items are referenced by id. Stackable items consolidate in inventory; others occupy single slots.

export const ITEMS = {
  // ─────────────── Logs (Woodcutting / Firemaking) ───────────────
  logs: {
    id: 'logs',
    name: 'Logs',
    description: 'A bundle of common wood, fresh from a felled tree.',
    value: 4,
    stackable: false,
    levelReq: 1
  },
  oak_logs: {
    id: 'oak_logs',
    name: 'Oak Logs',
    description: 'Heavy oak, dense and slow to burn but worth the wait.',
    value: 18,
    stackable: false,
    levelReq: 15
  },
  willow_logs: {
    id: 'willow_logs',
    name: 'Willow Logs',
    description: 'Pale wood from the riverbank willows. Catches a flame easily.',
    value: 24,
    stackable: false,
    levelReq: 30
  },
  maple_logs: {
    id: 'maple_logs',
    name: 'Maple Logs',
    description: 'Sweet-smelling maple. The sap runs amber when fresh-cut.',
    value: 50,
    stackable: false,
    levelReq: 45
  },

  // ─────────────── Ores (Mining) ───────────────
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    description: 'A chunk of reddish copper ore, fresh from a rock face.',
    value: 3,
    stackable: false,
    levelReq: 1
  },
  tin_ore: {
    id: 'tin_ore',
    name: 'Tin Ore',
    description: 'A dull gray lump of tin ore. Smelts down alongside copper.',
    value: 3,
    stackable: false,
    levelReq: 1
  },
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    description: 'A heavy lump of rust-streaked iron ore.',
    value: 17,
    stackable: false,
    levelReq: 15
  },

  // ─────────────── Raw Fish (Fishing) ───────────────
  raw_shrimp: {
    id: 'raw_shrimp',
    name: 'Raw Shrimp',
    description: 'A handful of tiny river shrimp, still wet.',
    value: 2,
    stackable: false
  },
  raw_trout: {
    id: 'raw_trout',
    name: 'Raw Trout',
    description: 'A speckled river trout. Needs cooking before it is edible.',
    value: 18,
    stackable: false
  },
  raw_salmon: {
    id: 'raw_salmon',
    name: 'Raw Salmon',
    description: 'A silver-pink salmon. Prized among river folk.',
    value: 32,
    stackable: false
  },
  cooked_shrimp: {
    id: 'cooked_shrimp',
    name: 'Fire-Boiled Shrimp',
    description: 'Shrimp boiled pink over open flame. Small but filling.',
    value: 8,
    stackable: false,
    heal: 3
  },
  cooked_trout: {
    id: 'cooked_trout',
    name: 'Smoked Trout',
    description: 'Trout smoked over willow chips until the flesh flakes.',
    value: 40,
    stackable: false,
    heal: 7
  },
  cooked_salmon: {
    id: 'cooked_salmon',
    name: 'Fire-Roasted Salmon',
    description: 'Salmon crisped over hot coals. Rich and sustaining.',
    value: 70,
    stackable: false,
    heal: 9
  },
  burnt_fish: {
    id: 'burnt_fish',
    name: 'Burnt Fish',
    description: 'A blackened, inedible husk. You should have watched it.',
    value: 0,
    stackable: false
  },

  // ─────────────── Food (Cooking / Healing) ───────────────
  raw_beef: {
    id: 'raw_beef',
    name: 'Raw Beef',
    description: 'A dripping cut of cow. Best not eaten as-is.',
    value: 3,
    stackable: false
  },
  cooked_beef: {
    id: 'cooked_beef',
    name: 'Roast Cut',
    description: 'A simple roasted cut of beef. Restores some vitality.',
    value: 12,
    stackable: false,
    heal: 4
  },
  raw_chicken: {
    id: 'raw_chicken',
    name: 'Raw Fowl',
    description: 'A plucked bird, ready for the pan.',
    value: 2,
    stackable: false
  },
  cooked_chicken: {
    id: 'cooked_chicken',
    name: 'Spit-Roast Fowl',
    description: 'A bird roasted on a stick. The smell alone is comforting.',
    value: 8,
    stackable: false,
    heal: 3
  },
  bread: {
    id: 'bread',
    name: 'Hearth Loaf',
    description: 'A round of dark bread baked in a stone oven.',
    value: 10,
    stackable: false,
    heal: 5
  },
  baked_potato: {
    id: 'baked_potato',
    name: 'Ashroot Tuber',
    description: 'A pale tuber baked whole in the coals. Filling and warm.',
    value: 14,
    stackable: false,
    heal: 6
  },
  trout: {
    id: 'trout',
    name: 'Smoked Trout',
    description: 'River trout, gutted and smoked over willow chips.',
    value: 35,
    stackable: false,
    heal: 8
  },

  // ─────────────── Combat: Swords ───────────────
  bronze_cutlass: {
    id: 'bronze_cutlass',
    name: 'Bronze Cutlass',
    description: 'A short curved blade of bronze. Cheap, dependable, and dull within a week.',
    value: 50,
    stackable: false,
    attack: 4,
    equipSlot: 'weapon',
    levelReq: 1
  },
  iron_cutlass: {
    id: 'iron_cutlass',
    name: 'Iron Cutlass',
    description: 'A heavier curved blade of black iron. Rusts if you forget it in the rain.',
    value: 180,
    stackable: false,
    attack: 9,
    equipSlot: 'weapon',
    levelReq: 5
  },
  steel_cutlass: {
    id: 'steel_cutlass',
    name: 'Steel Cutlass',
    description: 'A balanced curved blade of fine steel. Holds an edge through three battles.',
    value: 640,
    stackable: false,
    attack: 16,
    equipSlot: 'weapon',
    levelReq: 10
  },

  // ─────────────── Combat: Axes (Woodcutting + Weapon) ───────────────
  bronze_handaxe: {
    id: 'bronze_handaxe',
    name: 'Bronze Handaxe',
    description: 'A small bronze axe. Chops trees, splits skulls, leaks at the haft.',
    value: 40,
    stackable: false,
    attack: 3,
    equipSlot: 'weapon',
    levelReq: 1
  },
  iron_handaxe: {
    id: 'iron_handaxe',
    name: 'Iron Handaxe',
    description: 'An iron-headed axe with a hickory shaft.',
    value: 150,
    stackable: false,
    attack: 7,
    equipSlot: 'weapon',
    levelReq: 5
  },

  // ─────────────── Armor ───────────────
  leather_jerkin: {
    id: 'leather_jerkin',
    name: 'Leather Jerkin',
    description: 'A boiled leather chestpiece. Stops a knife, slows an arrow.',
    value: 60,
    stackable: false,
    equipSlot: 'body',
    levelReq: 1
  },
  bronze_hauberk: {
    id: 'bronze_hauberk',
    name: 'Bronze Hauberk',
    description: 'Riveted bronze plates over thick wool. Heavier than it looks.',
    value: 220,
    stackable: false,
    equipSlot: 'body',
    levelReq: 5
  },
  wooden_buckler: {
    id: 'wooden_buckler',
    name: 'Wooden Buckler',
    description: 'A small round shield of bound oak. Better than nothing.',
    value: 30,
    stackable: false,
    equipSlot: 'shield',
    levelReq: 1
  },

  // ─────────────── Resources / Drops ───────────────
  bones: {
    id: 'bones',
    name: 'Bones',
    description: 'A bundle of dry bones. Useful to those who pray.',
    value: 1,
    stackable: false
  },
  big_bones: {
    id: 'big_bones',
    name: 'Heavy Bones',
    description: 'Thick bones from something large. Heavier than they should be.',
    value: 8,
    stackable: false
  },
  feathers: {
    id: 'feathers',
    name: 'Feathers',
    description: 'A handful of soft chicken feathers. Useful for fletching.',
    value: 1,
    stackable: true
  },
  coins: {
    id: 'coins',
    name: 'Silver Marks',
    description: 'The common currency of Aldermere. Stamped with the old Brackhold seal.',
    value: 1,
    stackable: true
  },
  goblin_tooth: {
    id: 'goblin_tooth',
    name: 'Goblin Tooth',
    description: 'A yellow goblin fang. Trophy hunters pay a few marks for these.',
    value: 5,
    stackable: true
  },
  wolf_pelt: {
    id: 'wolf_pelt',
    name: 'Wolf Pelt',
    description: 'A grey wolf hide, still smelling of pine and damp earth.',
    value: 35,
    stackable: false
  },

  // ─────────────── Quest / Misc ───────────────
  hearthmoor_key: {
    id: 'hearthmoor_key',
    name: 'Iron Key',
    description: 'A heavy iron key. The bow is shaped like a wheat sheaf.',
    value: 0,
    stackable: false
  },
  wyrdstone_shard: {
    id: 'wyrdstone_shard',
    name: 'Wyrdstone Shard',
    description: 'A finger-sized shard of glowing pale stone. It hums against your palm.',
    value: 250,
    stackable: false
  },
  edda_locket: {
    id: 'edda_locket',
    name: 'Tarnished Locket',
    description: 'A small silver locket on a broken chain. There is a faded portrait inside.',
    value: 0,
    stackable: false
  },
  map_fragment: {
    id: 'map_fragment',
    name: 'Torn Map',
    description: 'A scrap of parchment showing part of a path through the Eastmarch hills.',
    value: 5,
    stackable: false
  }
};

// Helper: get item by id with safety
export function getItem(id) {
  return ITEMS[id] || null;
}

// Helper: list all items in a category by checking for fields
export function getEquippable() {
  return Object.values(ITEMS).filter(i => i.equipSlot);
}

export function getFood() {
  return Object.values(ITEMS).filter(i => i.heal);
}

export default ITEMS;
