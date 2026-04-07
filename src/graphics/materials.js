// =============================================================
// src/graphics/materials.js
// Pre-built shared MeshLambertMaterial palette for the game.
// Lambert is used so models react to lighting (sun + hemisphere).
// All colors are picked to read clearly in a chunky low-poly style.
//
// Owned by: graphics-artist
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const M = (color) => new THREE.MeshLambertMaterial({ color });

/**
 * Shared material palette. Reusing materials lets Three.js batch draw calls
 * and keeps memory low — never `clone()` these unless you need a per-instance
 * tint.
 *
 * @type {Object<string, THREE.MeshLambertMaterial>}
 */
export const MATERIALS = {
  // ---- Player / humanoid -----------------------------------
  skin:         M(0xf2c79a),
  hair:         M(0x5a3a1f),
  tunicBlue:    M(0x355c9a),
  tunicGreen:   M(0x386b3a),
  leatherBrown: M(0x6b4423),
  metalBronze:  M(0xb8763a),
  metalSteel:   M(0xb8c0c8),

  // ---- Cow ---------------------------------------------------
  cowWhite: M(0xf3ece2),
  cowBlack: M(0x222222),

  // ---- Goblin ------------------------------------------------
  goblinGreen: M(0x6ca350),

  // ---- Chicken -----------------------------------------------
  chickenWhite: M(0xf6f2e6),
  chickenRed:   M(0xc22d2d),
  beak:         M(0xe8a93a),

  // ---- Trees / foliage ---------------------------------------
  leafGreen:    M(0x4e8c3a),
  leafDark:     M(0x355f25),
  trunkBrown:   M(0x6b4423),
  oakTrunkDark: M(0x4a2f17),

  // ---- Item drops --------------------------------------------
  logBrown:    M(0x8a5a2b),
  meatRed:     M(0xb33b2a),
  meatCooked:  M(0x7a3318),
  boneTan:     M(0xe8e0c4),
  coinGold:    M(0xf5c542),

  // ---- World terrain / props ---------------------------------
  waterBlue: M(0x3a78c2),
  dirtBrown: M(0x6e4a25),
  stoneGrey: M(0x8a8a92),
  sandTan:   M(0xe6cf94),
};

// All player-built models should castShadow=true, so set the
// flag once on the materials that bear shadows by default.
// (Lambert materials don't carry shadow flags themselves —
// the meshes do — but we keep this here as the central palette.)
