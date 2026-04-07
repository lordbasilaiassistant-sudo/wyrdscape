// ============================================================
// Skills — OSRS-style XP table, level calc, XP gain, combat level
// Pure logic, no Three.js or DOM dependencies
// ============================================================

// XP table (levels 1..99). XP_TABLE[0] = xp required for level 1 (0).
// Formula: points += floor(lvl + 300 * 2^(lvl/7)); XP[lvl+1] = floor(points / 4)
export const XP_TABLE = [0];
{
  let points = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    XP_TABLE.push(Math.floor(points / 4));
  }
}

/** XP required to reach the given level (1..99). */
export function xpForLevel(level) {
  const idx = Math.min(98, Math.max(0, level - 1));
  return XP_TABLE[idx];
}

/** Derive the level (1..99) for a given total xp. */
export function levelForXp(xp) {
  for (let lvl = 98; lvl >= 0; lvl--) {
    if (xp >= XP_TABLE[lvl]) return lvl + 1;
  }
  return 1;
}

/** Starting skills object — OSRS default (HP starts at 10). */
export function defaultSkills() {
  return {
    attack:      { xp: 0,    level: 1 },
    strength:    { xp: 0,    level: 1 },
    defence:     { xp: 0,    level: 1 },
    hitpoints:   { xp: 1154, level: 10 },
    woodcutting: { xp: 0,    level: 1 },
    mining:      { xp: 0,    level: 1 },
    fishing:     { xp: 0,    level: 1 },
    cooking:     { xp: 0,    level: 1 },
    firemaking:  { xp: 0,    level: 1 },
  };
}

/**
 * Add XP to a player's skill. Recomputes level and reports level-ups.
 * @returns {{ leveledUp: boolean, oldLevel?: number, newLevel?: number }}
 */
export function gainXp(player, skillName, amount) {
  if (!player || !player.skills || !player.skills[skillName]) {
    return { leveledUp: false };
  }
  const skill = player.skills[skillName];
  const oldLevel = skill.level;
  skill.xp += amount;
  const newLevel = levelForXp(skill.xp);
  if (newLevel > oldLevel) {
    skill.level = newLevel;
    return { leveledUp: true, oldLevel, newLevel };
  }
  return { leveledUp: false };
}

/**
 * OSRS combat level formula (simplified, melee only — no ranged/magic yet):
 *   floor(((defence + hp + floor(prayer/2)) * 0.25) + ((attack + strength) * 0.325))
 * Missing skills default to 1 (prayer defaults to 1, giving floor(1/2) = 0).
 */
export function combatLevel(skills) {
  if (!skills) return 3;
  const attack   = skills.attack?.level   ?? 1;
  const strength = skills.strength?.level ?? 1;
  const defence  = skills.defence?.level  ?? 1;
  const hp       = skills.hitpoints?.level ?? 10;
  const prayer   = skills.prayer?.level   ?? 1;
  const base   = (defence + hp + Math.floor(prayer / 2)) * 0.25;
  const melee  = (attack + strength) * 0.325;
  return Math.floor(base + melee);
}
