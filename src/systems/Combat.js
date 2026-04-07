// ============================================================
// Combat — hit chance, max hit, damage rolls, attack resolution
// Pure numeric logic, no Three.js or DOM dependencies
// ============================================================

/**
 * Roll a hit against an opponent.
 * Attacker accuracy (att+8)*10 vs defender defence (def+8)*10.
 * If roll passes, damage is uniform 0..maxHit inclusive.
 */
function rollHit(attackLevel, strengthLevel, defenceLevel, bonus = 0) {
  const attRoll = (attackLevel + 8) * 10;
  const defRoll = (defenceLevel + 8) * 10;
  let hitChance;
  if (attRoll > defRoll) {
    hitChance = 1 - (defRoll + 2) / (2 * (attRoll + 1));
  } else {
    hitChance = attRoll / (2 * (defRoll + 1));
  }
  const hit = Math.random() < hitChance;
  const maxHit = Math.floor((strengthLevel + 8) * 0.13) + 1 + bonus;
  const damage = hit ? Math.floor(Math.random() * (maxHit + 1)) : 0;
  return { damage, hit, maxHit };
}

/**
 * Player attacking an NPC.
 * Player max hit gets +2 if bronzeSword is equipped.
 * @returns {{ damage: number, hit: boolean }}
 */
export function calculatePlayerHit(player, npc) {
  const attack   = player?.skills?.attack?.level   ?? 1;
  const strength = player?.skills?.strength?.level ?? 1;
  const npcDef   = npc?.defence ?? 1;
  const bonus    = player?.equipped?.weapon === 'bronzeSword' ? 2 : 0;
  const { damage, hit } = rollHit(attack, strength, npcDef, bonus);
  return { damage, hit };
}

/**
 * NPC attacking a player.
 * NPC max hit is capped by its defined maxHit (from monster data).
 * @returns {{ damage: number, hit: boolean }}
 */
export function calculateNpcHit(npc, player) {
  const playerDef = player?.skills?.defence?.level ?? 1;
  const npcAtt = npc?.attack ?? 1;
  const attRoll = (npcAtt + 8) * 10;
  const defRoll = (playerDef + 8) * 10;
  let hitChance;
  if (attRoll > defRoll) {
    hitChance = 1 - (defRoll + 2) / (2 * (attRoll + 1));
  } else {
    hitChance = attRoll / (2 * (defRoll + 1));
  }
  const hit = Math.random() < hitChance;
  const maxHit = npc?.maxHit ?? 1;
  const damage = hit ? Math.floor(Math.random() * (maxHit + 1)) : 0;
  return { damage, hit };
}

/**
 * Resolve a single attack, mutating target HP. Returns { damage, hit, killed }.
 * Attacker and target are plain objects with .hp fields.
 * @param {object} attacker - player or npc
 * @param {object} target - player or npc
 * @param {object} gameState - optional, for future hooks
 */
export function tryAttack(attacker, target, gameState) {
  // Determine direction by presence of skills (players have skills; npcs don't).
  const attackerIsPlayer = !!attacker?.skills;
  const result = attackerIsPlayer
    ? calculatePlayerHit(attacker, target)
    : calculateNpcHit(attacker, target);

  if (result.damage > 0) {
    target.hp = Math.max(0, (target.hp ?? 0) - result.damage);
  }
  const killed = (target.hp ?? 0) <= 0;
  return { damage: result.damage, hit: result.hit, killed };
}
