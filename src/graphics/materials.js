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
  skin:           M(0xf2c79a),
  skinShade:      M(0xd49a6a),  // shadowed/darker skin for nose & detail
  hair:           M(0x5a3a1f),
  tunicBlue:      M(0x355c9a),
  tunicBlueDark:  M(0x223e6a),  // belt / collar trim shadow on the blue tunic
  tunicGreen:     M(0x386b3a),
  leatherBrown:   M(0x6b4423),
  bootDark:       M(0x2b1a0c),  // dark leather boots, distinct from legs
  metalBronze:    M(0xb8763a),
  metalSteel:     M(0xb8c0c8),
  eyeBlack:       M(0x141014),  // tiny eye / mouth pixels
  toothWhite:     M(0xf2eed6),  // small fang / tooth highlights

  // ---- Cow ---------------------------------------------------
  cowWhite:    M(0xf3ece2),
  cowBlack:    M(0x222222),
  cowUdderPink:M(0xf2a8b0),
  hoofBrown:   M(0x2b1a0c),

  // ---- Goblin ------------------------------------------------
  goblinGreen:     M(0x6ca350),
  goblinGreenDark: M(0x4a7a35),  // shaded goblin skin / muscle
  goblinScrap:     M(0x4a311a),  // dark leather scraps over the tunic
  goblinBuckle:    M(0xc89a3a),  // dull brass belt buckle

  // ---- Chicken -----------------------------------------------
  chickenWhite: M(0xf6f2e6),
  chickenRed:   M(0xc22d2d),
  chickenWattle:M(0xa01e1e),  // slightly darker red for the wattle
  beak:         M(0xe8a93a),

  // ---- Trees / foliage ---------------------------------------
  leafGreen:    M(0x4e8c3a),
  leafGreenLt:  M(0x6fb04d),  // brighter highlight tier
  leafGreenDk:  M(0x33682a),  // shadow tier
  leafDark:     M(0x355f25),
  leafDarkLt:   M(0x4a7d33),  // oak highlight tier
  trunkBrown:   M(0x6b4423),
  oakTrunkDark: M(0x4a2f17),
  branchBrown:  M(0x553318),  // small branches sticking out

  // ---- Item drops --------------------------------------------
  logBrown:    M(0x8a5a2b),
  logBrownDk:  M(0x5a3a18),  // grain stripes / end-grain rings
  meatRed:     M(0xb33b2a),
  meatCooked:  M(0x7a3318),
  boneTan:     M(0xe8e0c4),
  boneShade:   M(0xb8b094),  // skull / bone shading
  coinGold:    M(0xf5c542),
  coinGoldDk:  M(0xb89020),  // shadow ring on coin stack
  fishSilver:  M(0xb8c4cc),
  fishBlue:    M(0x4a7080),  // dorsal stripe / fin
  oreCopper:   M(0xc25a25),
  oreIron:     M(0x6a5040),

  // ---- World terrain / props ---------------------------------
  waterBlue:  M(0x3a78c2),
  dirtBrown:  M(0x6e4a25),
  stoneGrey:  M(0x8a8a92),
  stoneDark:  M(0x5e5e66),  // window slits and shadow recesses
  sandTan:    M(0xe6cf94),
  thatchTan:  M(0xc89a48),  // straw/thatch roofing color
  thatchDark: M(0x8a6a30),  // shadow band on thatch
};

// All player-built models should castShadow=true, so set the
// flag once on the materials that bear shadows by default.
// (Lambert materials don't carry shadow flags themselves —
// the meshes do — but we keep this here as the central palette.)
