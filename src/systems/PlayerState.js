// ============================================================
// PlayerState — canonical starting state for a new character
// Pure data, no Three.js or DOM dependencies
// ============================================================

import { defaultSkills } from './Skills.js';
import { defaultInventory } from './Inventory.js';

/** Default starting player state. Tile coords match world spawnPoint (12, 12). */
export function defaultPlayerState() {
  return {
    x: 12,
    z: 12,
    hp: 10,
    maxHp: 10,
    skills: defaultSkills(),
    inventory: defaultInventory(),
    equipped: {},
    totalKills: 0,
    totalLogs: 0,
  };
}
