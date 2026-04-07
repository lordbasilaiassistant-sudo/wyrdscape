// =============================================================
// src/graphics/models.js
// Procedural low-poly model factories. Each function returns a
// self-contained THREE.Group ready to be added to a scene and
// positioned via .position.set(x, y, z).
//
// Style: chunky low-poly, primitives only (Box / Cylinder /
// Sphere / Cone / Tetrahedron). No external assets.
//
// Owned by: graphics-artist
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { MATERIALS as MAT } from './materials.js';

// ---- Reusable geometries ------------------------------------
// Sharing geometries reduces GPU buffer churn. We build each
// shape once at module load and reuse across factories.
const GEO = {
  // Humanoid pieces
  headBox:    new THREE.BoxGeometry(0.6, 0.6, 0.6),
  torsoBox:   new THREE.BoxGeometry(0.7, 0.9, 0.4),
  armBox:     new THREE.BoxGeometry(0.22, 0.85, 0.22),
  legBox:     new THREE.BoxGeometry(0.26, 0.85, 0.26),
  hairCap:    new THREE.BoxGeometry(0.65, 0.18, 0.65),

  // Cow
  cowBody:    new THREE.BoxGeometry(1.6, 0.9, 0.8),
  cowLeg:     new THREE.BoxGeometry(0.22, 0.7, 0.22),
  cowHead:    new THREE.BoxGeometry(0.55, 0.55, 0.55),
  cowHorn:    new THREE.ConeGeometry(0.07, 0.25, 6),
  cowSpot:    new THREE.BoxGeometry(0.4, 0.05, 0.3),

  // Chicken
  chickenBody: new THREE.BoxGeometry(0.5, 0.4, 0.3),
  chickenHead: new THREE.BoxGeometry(0.25, 0.28, 0.25),
  chickenComb: new THREE.BoxGeometry(0.08, 0.1, 0.18),
  chickenBeak: new THREE.ConeGeometry(0.06, 0.14, 4),
  chickenLeg:  new THREE.BoxGeometry(0.06, 0.18, 0.06),

  // Goblin ear
  goblinEar: new THREE.ConeGeometry(0.08, 0.18, 4),

  // Tree
  treeTrunk:    new THREE.CylinderGeometry(0.32, 0.4, 2, 8),
  treeFoliage:  new THREE.SphereGeometry(1.2, 8, 6),
  oakTrunk:     new THREE.CylinderGeometry(0.5, 0.65, 2.6, 10),
  oakFoliage:   new THREE.SphereGeometry(1.7, 10, 7),
  treeStump:    new THREE.CylinderGeometry(0.45, 0.5, 0.45, 8),

  // Item drops
  logDrop:    new THREE.CylinderGeometry(0.12, 0.12, 0.5, 8),
  coinDrop:   new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
  meatDrop:   new THREE.BoxGeometry(0.32, 0.18, 0.22),
  boneDrop:   new THREE.BoxGeometry(0.4,  0.1,  0.1),
};

// ---- Internal helpers ---------------------------------------
function mesh(geometry, material, castShadow = true, receiveShadow = false) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = castShadow;
  m.receiveShadow = receiveShadow;
  return m;
}

// =============================================================
// HUMANOIDS
// =============================================================

// Per-instance material cache, keyed by hex color, so customising
// player appearance does not balloon GPU memory. Each unique color
// is only allocated once across the whole game.
const _customMatCache = new Map();
function _matFor(color) {
  if (color === undefined || color === null) return null;
  const key = (color instanceof THREE.Color) ? color.getHex() : color;
  let m = _customMatCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: key });
    _customMatCache.set(key, m);
  }
  return m;
}

/**
 * Player character — chunky humanoid, total height ~2 units, feet at y=0.
 * Group origin sits at the feet so .position.set(x, 0, z) places it on ground.
 *
 * Supports per-instance customization for visible equipment, in the OSRS
 * spirit where every player wears different gear.
 *
 * @param {object}  [options]
 * @param {number}  [options.tunicColor] - Hex color for torso + arms (defaults to MAT.tunicBlue)
 * @param {number}  [options.hairColor]  - Hex color for hair cap (defaults to MAT.hair)
 * @param {number}  [options.legColor]   - Hex color for legs/boots (defaults to MAT.leatherBrown)
 * @param {boolean} [options.hasSword]   - If true, holds a small steel sword in the right hand
 */
export function createPlayerModel(options = {}) {
  const g = new THREE.Group();
  g.name = 'player';

  const tunicMat = _matFor(options.tunicColor) || MAT.tunicBlue;
  const hairMat  = _matFor(options.hairColor)  || MAT.hair;
  const legMat   = _matFor(options.legColor)   || MAT.leatherBrown;

  // Legs (two side-by-side)
  const lLeg = mesh(GEO.legBox, legMat);
  lLeg.position.set(-0.18, 0.425, 0);
  const rLeg = mesh(GEO.legBox, legMat);
  rLeg.position.set( 0.18, 0.425, 0);

  // Torso
  const torso = mesh(GEO.torsoBox, tunicMat);
  torso.position.set(0, 1.30, 0);

  // Arms
  const lArm = mesh(GEO.armBox, tunicMat);
  lArm.position.set(-0.46, 1.30, 0);
  const rArm = mesh(GEO.armBox, tunicMat);
  rArm.position.set( 0.46, 1.30, 0);

  // Head + hair cap
  const head = mesh(GEO.headBox, MAT.skin);
  head.position.set(0, 2.05, 0);
  const hair = mesh(GEO.hairCap, hairMat);
  hair.position.set(0, 2.40, 0);

  g.add(lLeg, rLeg, torso, lArm, rArm, head, hair);

  // Optional weapon — a short bronze-pommel steel sword in the right hand
  if (options.hasSword) {
    const sword = new THREE.Group();
    const blade = mesh(new THREE.BoxGeometry(0.08, 0.7, 0.04), MAT.metalSteel);
    blade.position.y = 0.35;
    const guard = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), MAT.metalBronze);
    guard.position.y = 0.0;
    const grip = mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), MAT.leatherBrown);
    grip.position.y = -0.10;
    sword.add(blade, guard, grip);
    // Position so the grip sits in the right hand and the blade points down/out
    sword.position.set(0.62, 0.95, 0.05);
    sword.rotation.z = Math.PI / 8;
    g.add(sword);
  }

  return g;
}

/**
 * Goblin — green-skinned humanoid, slightly smaller than the player,
 * leather tunic, pointy ears.
 */
export function createGoblinModel() {
  const g = new THREE.Group();
  g.name = 'goblin';

  const lLeg = mesh(GEO.legBox, MAT.leatherBrown);
  lLeg.position.set(-0.15, 0.35, 0);
  lLeg.scale.set(0.85, 0.8, 0.85);
  const rLeg = mesh(GEO.legBox, MAT.leatherBrown);
  rLeg.position.set( 0.15, 0.35, 0);
  rLeg.scale.set(0.85, 0.8, 0.85);

  const torso = mesh(GEO.torsoBox, MAT.leatherBrown);
  torso.position.set(0, 1.05, 0);
  torso.scale.set(0.85, 0.85, 0.85);

  const lArm = mesh(GEO.armBox, MAT.goblinGreen);
  lArm.position.set(-0.40, 1.05, 0);
  lArm.scale.set(0.9, 0.85, 0.9);
  const rArm = mesh(GEO.armBox, MAT.goblinGreen);
  rArm.position.set( 0.40, 1.05, 0);
  rArm.scale.set(0.9, 0.85, 0.9);

  const head = mesh(GEO.headBox, MAT.goblinGreen);
  head.position.set(0, 1.70, 0);
  head.scale.set(0.85, 0.85, 0.85);

  // Pointy ears (cones rotated to stick sideways)
  const lEar = mesh(GEO.goblinEar, MAT.goblinGreen);
  lEar.position.set(-0.30, 1.78, 0);
  lEar.rotation.z =  Math.PI / 2;
  const rEar = mesh(GEO.goblinEar, MAT.goblinGreen);
  rEar.position.set( 0.30, 1.78, 0);
  rEar.rotation.z = -Math.PI / 2;

  g.add(lLeg, rLeg, torso, lArm, rArm, head, lEar, rEar);
  return g;
}

// =============================================================
// ANIMALS
// =============================================================

/**
 * Cow — boxy quadruped with brown legs, white body, black spots, horns.
 */
export function createCowModel() {
  const g = new THREE.Group();
  g.name = 'cow';

  // Body
  const body = mesh(GEO.cowBody, MAT.cowWhite);
  body.position.set(0, 0.95, 0);

  // 4 legs (brown)
  const legPositions = [
    [-0.55, 0.35,  0.30],
    [ 0.55, 0.35,  0.30],
    [-0.55, 0.35, -0.30],
    [ 0.55, 0.35, -0.30],
  ];
  const legs = legPositions.map(([x, y, z]) => {
    const l = mesh(GEO.cowLeg, MAT.leatherBrown);
    l.position.set(x, y, z);
    return l;
  });

  // Head (front of body, +X side)
  const head = mesh(GEO.cowHead, MAT.cowWhite);
  head.position.set(0.95, 1.05, 0);

  // Horns (two small cones on top of head)
  const lHorn = mesh(GEO.cowHorn, MAT.boneTan);
  lHorn.position.set(0.95, 1.42,  0.18);
  lHorn.rotation.z = -Math.PI / 8;
  const rHorn = mesh(GEO.cowHorn, MAT.boneTan);
  rHorn.position.set(0.95, 1.42, -0.18);
  rHorn.rotation.z = -Math.PI / 8;

  // Black spots — flat boxes laid on top of body
  const spotPositions = [
    [-0.4, 1.42,  0.10],
    [ 0.2, 1.42, -0.20],
    [-0.1, 1.42,  0.30],
  ];
  const spots = spotPositions.map(([x, y, z]) => {
    const s = mesh(GEO.cowSpot, MAT.cowBlack);
    s.position.set(x, y, z);
    return s;
  });

  g.add(body, ...legs, head, lHorn, rHorn, ...spots);
  return g;
}

/**
 * Chicken — small white box body with red comb and orange beak.
 */
export function createChickenModel() {
  const g = new THREE.Group();
  g.name = 'chicken';

  const body = mesh(GEO.chickenBody, MAT.chickenWhite);
  body.position.set(0, 0.40, 0);

  const head = mesh(GEO.chickenHead, MAT.chickenWhite);
  head.position.set(0.20, 0.70, 0);

  const comb = mesh(GEO.chickenComb, MAT.chickenRed);
  comb.position.set(0.20, 0.88, 0);

  const beak = mesh(GEO.chickenBeak, MAT.beak);
  beak.position.set(0.36, 0.70, 0);
  beak.rotation.z = -Math.PI / 2;

  const lLeg = mesh(GEO.chickenLeg, MAT.beak);
  lLeg.position.set(-0.05, 0.10,  0.08);
  const rLeg = mesh(GEO.chickenLeg, MAT.beak);
  rLeg.position.set(-0.05, 0.10, -0.08);

  g.add(body, head, comb, beak, lLeg, rLeg);
  return g;
}

// =============================================================
// TREES / NATURE
// =============================================================

/**
 * Standard tree — slim trunk + green sphere foliage. Total height ~3.5.
 */
export function createTreeModel() {
  const g = new THREE.Group();
  g.name = 'tree';

  const trunk = mesh(GEO.treeTrunk, MAT.trunkBrown);
  trunk.position.set(0, 1.0, 0);

  const foliage = mesh(GEO.treeFoliage, MAT.leafGreen);
  foliage.position.set(0, 2.6, 0);

  g.add(trunk, foliage);
  return g;
}

/**
 * Oak tree — bigger, darker foliage and thicker trunk. Total height ~4.5.
 */
export function createOakTreeModel() {
  const g = new THREE.Group();
  g.name = 'oak-tree';

  const trunk = mesh(GEO.oakTrunk, MAT.oakTrunkDark);
  trunk.position.set(0, 1.3, 0);

  const foliage = mesh(GEO.oakFoliage, MAT.leafDark);
  foliage.position.set(0, 3.4, 0);

  g.add(trunk, foliage);
  return g;
}

/**
 * Tree stump — what's left after a tree is chopped.
 */
export function createTreeStumpModel() {
  const g = new THREE.Group();
  g.name = 'tree-stump';

  const stump = mesh(GEO.treeStump, MAT.trunkBrown);
  stump.position.set(0, 0.225, 0);

  g.add(stump);
  return g;
}

// =============================================================
// BUILDINGS / STRUCTURES
// =============================================================

/**
 * Simple house in OSRS-Lumbridge style: stone walls, wooden floor,
 * and a conical/peaked roof. Origin sits at the floor center, so a
 * caller can place it with `.position.set(x, 0, z)`.
 *
 * @param {number} width  - X size in world units
 * @param {number} depth  - Z size
 * @param {number} height - wall height (roof sits on top)
 */
export function createBuildingModel(width = 4, depth = 4, height = 3) {
  const g = new THREE.Group();
  g.name = 'building';

  // Wood floor — slightly inset and lifted just above ground level
  const floorGeo = new THREE.BoxGeometry(width, 0.12, depth);
  const floor = mesh(floorGeo, MAT.logBrown);
  floor.position.set(0, 0.06, 0);
  floor.receiveShadow = true;

  // Stone walls — single box body. Stone gray reads as
  // a chunky cottage from a distance.
  const wallsGeo = new THREE.BoxGeometry(width, height, depth);
  const walls = mesh(wallsGeo, MAT.stoneGrey);
  walls.position.set(0, 0.12 + height / 2, 0);
  walls.receiveShadow = true;

  // Conical roof — a 4-sided pyramid sitting on top of the walls,
  // wider than the walls so it casts a slight overhang shadow.
  const roofRadius = Math.max(width, depth) * 0.78;
  const roofHeight = height * 0.85;
  const roofGeo = new THREE.ConeGeometry(roofRadius, roofHeight, 4);
  const roof = mesh(roofGeo, MAT.oakTrunkDark);
  roof.position.set(0, 0.12 + height + roofHeight / 2, 0);
  roof.rotation.y = Math.PI / 4;     // align flat sides with walls

  g.add(floor, walls, roof);
  return g;
}

/**
 * Wooden fence rail of the given length, centered on origin, running along +X.
 */
export function createFenceModel(length = 4) {
  const g = new THREE.Group();
  g.name = 'fence';

  // Top rail
  const railGeo = new THREE.BoxGeometry(length, 0.1, 0.08);
  const topRail = mesh(railGeo, MAT.trunkBrown);
  topRail.position.set(0, 0.85, 0);

  const midRail = mesh(railGeo, MAT.trunkBrown);
  midRail.position.set(0, 0.45, 0);

  // Posts every ~1 unit
  const postGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);
  const postCount = Math.max(2, Math.ceil(length) + 1);
  const step = length / (postCount - 1);
  for (let i = 0; i < postCount; i++) {
    const p = mesh(postGeo, MAT.trunkBrown);
    p.position.set(-length / 2 + i * step, 0.5, 0);
    g.add(p);
  }

  g.add(topRail, midRail);
  return g;
}

// =============================================================
// ITEM DROPS (small ground pickups)
// =============================================================

export function createLogDrop() {
  const g = new THREE.Group();
  g.name = 'log-drop';
  const log = mesh(GEO.logDrop, MAT.logBrown);
  log.position.y = 0.12;
  log.rotation.z = Math.PI / 2;
  g.add(log);
  return g;
}

export function createCoinDrop() {
  const g = new THREE.Group();
  g.name = 'coin-drop';
  const coin = mesh(GEO.coinDrop, MAT.coinGold);
  coin.position.y = 0.08;
  g.add(coin);
  return g;
}

export function createMeatDrop() {
  const g = new THREE.Group();
  g.name = 'meat-drop';
  const meat = mesh(GEO.meatDrop, MAT.meatRed);
  meat.position.y = 0.09;
  g.add(meat);
  return g;
}

export function createBoneDrop() {
  const g = new THREE.Group();
  g.name = 'bone-drop';
  const bone = mesh(GEO.boneDrop, MAT.boneTan);
  bone.position.y = 0.05;
  g.add(bone);
  return g;
}
