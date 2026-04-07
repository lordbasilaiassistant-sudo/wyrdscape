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

  // Limbs use a "pivot group at the joint + child mesh offset downward"
  // pattern so the Animator can rotate them around the top (shoulder/hip)
  // instead of the box center. Without this, rotating a limb would swing
  // its center through the body.

  // Legs (two side-by-side). Hip pivots at y=0.85, leg hangs below.
  const lLeg = new THREE.Group();
  lLeg.name = 'leftLeg';
  lLeg.position.set(-0.18, 0.85, 0);
  const lLegMesh = mesh(GEO.legBox, legMat);
  lLegMesh.position.y = -0.425;
  lLeg.add(lLegMesh);

  const rLeg = new THREE.Group();
  rLeg.name = 'rightLeg';
  rLeg.position.set(0.18, 0.85, 0);
  const rLegMesh = mesh(GEO.legBox, legMat);
  rLegMesh.position.y = -0.425;
  rLeg.add(rLegMesh);

  // Torso
  const torso = mesh(GEO.torsoBox, tunicMat);
  torso.name = 'body';
  torso.position.set(0, 1.30, 0);

  // Arms. Shoulder pivots at y=1.725, arm hangs below.
  const lArm = new THREE.Group();
  lArm.name = 'leftArm';
  lArm.position.set(-0.46, 1.725, 0);
  const lArmMesh = mesh(GEO.armBox, tunicMat);
  lArmMesh.position.y = -0.425;
  lArm.add(lArmMesh);

  const rArm = new THREE.Group();
  rArm.name = 'rightArm';
  rArm.position.set(0.46, 1.725, 0);
  const rArmMesh = mesh(GEO.armBox, tunicMat);
  rArmMesh.position.y = -0.425;
  rArm.add(rArmMesh);

  // Head + hair cap
  const head = mesh(GEO.headBox, MAT.skin);
  head.name = 'head';
  head.position.set(0, 2.05, 0);
  const hair = mesh(GEO.hairCap, hairMat);
  hair.name = 'hair';
  hair.position.set(0, 2.40, 0);

  g.add(lLeg, rLeg, torso, lArm, rArm, head, hair);

  // Optional weapon — parented to the right arm pivot so it follows arm
  // swings automatically during walk/attack animations.
  if (options.hasSword) {
    const sword = new THREE.Group();
    sword.name = 'sword';
    const blade = mesh(new THREE.BoxGeometry(0.08, 0.7, 0.04), MAT.metalSteel);
    blade.position.y = 0.35;
    const guard = mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), MAT.metalBronze);
    guard.position.y = 0.0;
    const grip = mesh(new THREE.BoxGeometry(0.06, 0.16, 0.06), MAT.leatherBrown);
    grip.position.y = -0.10;
    sword.add(blade, guard, grip);
    // Sword is held in the hand at the bottom of the right arm (~y=-0.775 in
    // arm-pivot local space). Angled slightly outward.
    sword.position.set(0.16, -0.775, 0.05);
    sword.rotation.z = Math.PI / 8;
    rArm.add(sword);
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

  // Goblin limbs use the same pivot-group pattern as the player so the
  // animator can rotate them around the joint.
  const gobLegY = 0.68; // ~0.85 * 0.8 scaled leg length = 0.68 hip height
  const lLeg = new THREE.Group();
  lLeg.name = 'leftLeg';
  lLeg.position.set(-0.15, gobLegY, 0);
  const lLegMesh = mesh(GEO.legBox, MAT.leatherBrown);
  lLegMesh.position.y = -0.34;
  lLegMesh.scale.set(0.85, 0.8, 0.85);
  lLeg.add(lLegMesh);

  const rLeg = new THREE.Group();
  rLeg.name = 'rightLeg';
  rLeg.position.set(0.15, gobLegY, 0);
  const rLegMesh = mesh(GEO.legBox, MAT.leatherBrown);
  rLegMesh.position.y = -0.34;
  rLegMesh.scale.set(0.85, 0.8, 0.85);
  rLeg.add(rLegMesh);

  const torso = mesh(GEO.torsoBox, MAT.leatherBrown);
  torso.name = 'body';
  torso.position.set(0, 1.05, 0);
  torso.scale.set(0.85, 0.85, 0.85);

  // Shoulder pivots ~= torso top (~1.05 + 0.45*0.85 = ~1.43)
  const gobArmY = 1.43;
  const lArm = new THREE.Group();
  lArm.name = 'leftArm';
  lArm.position.set(-0.40, gobArmY, 0);
  const lArmMesh = mesh(GEO.armBox, MAT.goblinGreen);
  lArmMesh.position.y = -0.36;
  lArmMesh.scale.set(0.9, 0.85, 0.9);
  lArm.add(lArmMesh);

  const rArm = new THREE.Group();
  rArm.name = 'rightArm';
  rArm.position.set(0.40, gobArmY, 0);
  const rArmMesh = mesh(GEO.armBox, MAT.goblinGreen);
  rArmMesh.position.y = -0.36;
  rArmMesh.scale.set(0.9, 0.85, 0.9);
  rArm.add(rArmMesh);

  const head = mesh(GEO.headBox, MAT.goblinGreen);
  head.name = 'head';
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
  body.name = 'body';
  body.position.set(0, 0.95, 0);

  // 4 legs (brown). Each leg is a pivot group at the hip with a mesh
  // hanging below — same pattern as humanoids, so the animator can
  // rotate each leg around its hip.
  const legSpecs = [
    { name: 'frontLeftLeg',  pos: [-0.55, 0.70,  0.30] },
    { name: 'frontRightLeg', pos: [ 0.55, 0.70,  0.30] },
    { name: 'backLeftLeg',   pos: [-0.55, 0.70, -0.30] },
    { name: 'backRightLeg',  pos: [ 0.55, 0.70, -0.30] },
  ];
  const legs = legSpecs.map(({ name, pos }) => {
    const pivot = new THREE.Group();
    pivot.name = name;
    pivot.position.set(pos[0], pos[1], pos[2]);
    const l = mesh(GEO.cowLeg, MAT.leatherBrown);
    l.position.y = -0.35;
    pivot.add(l);
    return pivot;
  });

  // Head (front of body, +X side)
  const head = mesh(GEO.cowHead, MAT.cowWhite);
  head.name = 'head';
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
  body.name = 'body';
  body.position.set(0, 0.40, 0);

  const head = mesh(GEO.chickenHead, MAT.chickenWhite);
  head.name = 'head';
  head.position.set(0.20, 0.70, 0);

  const comb = mesh(GEO.chickenComb, MAT.chickenRed);
  comb.position.set(0.20, 0.88, 0);

  const beak = mesh(GEO.chickenBeak, MAT.beak);
  beak.position.set(0.36, 0.70, 0);
  beak.rotation.z = -Math.PI / 2;

  const lLeg = mesh(GEO.chickenLeg, MAT.beak);
  lLeg.name = 'leftLeg';
  lLeg.position.set(-0.05, 0.10,  0.08);
  const rLeg = mesh(GEO.chickenLeg, MAT.beak);
  rLeg.name = 'rightLeg';
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
// MINING / FISHING / FIREMAKING props
// =============================================================

/**
 * Rock node for mining. Chunky gray cylinder with a bumpy top.
 * Optional oreColor tints a small visible vein so players can tell
 * copper / tin / iron apart at a glance.
 */
export function createRockNodeModel(oreColor = 0x9a6a4a) {
  const g = new THREE.Group();
  g.name = 'rock-node';

  const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 1.0, 8);
  const base = mesh(baseGeo, MAT.stoneGrey);
  base.position.y = 0.5;
  g.add(base);

  // Bumpy top — two small boxes skewed to look chiseled
  const bumpGeo = new THREE.BoxGeometry(0.45, 0.25, 0.45);
  const bump1 = mesh(bumpGeo, MAT.stoneGrey);
  bump1.position.set(-0.15, 1.1, 0.1);
  bump1.rotation.y = 0.35;
  g.add(bump1);

  const bump2 = mesh(bumpGeo, MAT.stoneGrey);
  bump2.position.set(0.2, 1.05, -0.1);
  bump2.rotation.y = -0.25;
  g.add(bump2);

  // Ore vein — small colored cube embedded in the rock
  const veinGeo = new THREE.BoxGeometry(0.22, 0.18, 0.22);
  const veinMat = new THREE.MeshLambertMaterial({ color: oreColor });
  const vein = new THREE.Mesh(veinGeo, veinMat);
  vein.position.set(0.05, 0.9, 0.35);
  vein.castShadow = true;
  g.add(vein);

  return g;
}

/**
 * Depleted rock — flat gray rubble left after mining, replaced
 * with a fresh node after respawn.
 */
export function createRockDepletedModel() {
  const g = new THREE.Group();
  g.name = 'rock-depleted';

  const rubbleGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.3, 8);
  const rubble = mesh(rubbleGeo, MAT.stoneGrey);
  rubble.position.y = 0.15;
  g.add(rubble);

  return g;
}

/**
 * Fishing spot — flat cyan disc just above the water surface.
 */
export function createFishingSpotModel() {
  const g = new THREE.Group();
  g.name = 'fishing-spot';

  const ringGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.04, 16);
  const ringMat = new THREE.MeshLambertMaterial({
    color: 0x9fdfff,
    transparent: true,
    opacity: 0.75,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.18;
  g.add(ring);

  const innerGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12);
  const innerMat = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  inner.position.y = 0.2;
  g.add(inner);

  return g;
}

/**
 * Campfire — stacked logs with a red/orange flame cone on top.
 * The flame mesh is exposed via g.flameMesh for per-frame flicker.
 */
export function createCampfireModel() {
  const g = new THREE.Group();
  g.name = 'campfire';

  // Stacked crossed logs
  const logGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.9, 6);
  const log1 = mesh(logGeo, MAT.logBrown);
  log1.position.set(0, 0.14, 0);
  log1.rotation.z = Math.PI / 2;
  g.add(log1);

  const log2 = mesh(logGeo, MAT.logBrown);
  log2.position.set(0, 0.14, 0);
  log2.rotation.x = Math.PI / 2;
  g.add(log2);

  // Glowing embers ring
  const emberGeo = new THREE.CylinderGeometry(0.45, 0.5, 0.08, 10);
  const emberMat = new THREE.MeshLambertMaterial({
    color: 0x7a1a08,
    emissive: 0x5a0c04,
  });
  const embers = new THREE.Mesh(emberGeo, emberMat);
  embers.position.y = 0.04;
  g.add(embers);

  // Outer flame cone
  const flameGeo = new THREE.ConeGeometry(0.4, 0.9, 6);
  const flameMat = new THREE.MeshLambertMaterial({
    color: 0xff8030,
    emissive: 0xff5010,
    transparent: true,
    opacity: 0.9,
  });
  const flame = new THREE.Mesh(flameGeo, flameMat);
  flame.position.y = 0.7;
  flame.castShadow = false;
  g.add(flame);

  // Inner brighter flame
  const innerFlameGeo = new THREE.ConeGeometry(0.22, 0.55, 5);
  const innerFlameMat = new THREE.MeshLambertMaterial({
    color: 0xffe060,
    emissive: 0xffc040,
  });
  const innerFlame = new THREE.Mesh(innerFlameGeo, innerFlameMat);
  innerFlame.position.y = 0.85;
  g.add(innerFlame);

  g.flameMesh = flame;
  g.innerFlameMesh = innerFlame;
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

  // Wood plank floor visible from above through the open top.
  const floorGeo = new THREE.BoxGeometry(width, 0.12, depth);
  const floor = mesh(floorGeo, MAT.logBrown);
  floor.position.set(0, 0.06, 0);
  floor.receiveShadow = true;
  g.add(floor);

  // Four thin stone walls instead of a solid box, so the iso
  // camera looks down INTO the room — like an OSRS building
  // with the roof culled. Each wall is a thin BoxGeometry.
  const wallThick = 0.18;
  const wallY = 0.12 + height / 2;
  const wallMat = MAT.stoneGrey;

  // North wall (at +Z edge)
  const nWall = mesh(new THREE.BoxGeometry(width, height, wallThick), wallMat);
  nWall.position.set(0, wallY, depth / 2 - wallThick / 2);
  nWall.castShadow = true; nWall.receiveShadow = true;

  // South wall (at -Z edge) — leave a 1-unit doorway gap centered
  const doorW = Math.min(1.4, width * 0.35);
  const sideW = (width - doorW) / 2;
  if (sideW > 0.1) {
    const sLeft = mesh(new THREE.BoxGeometry(sideW, height, wallThick), wallMat);
    sLeft.position.set(-(doorW / 2 + sideW / 2), wallY, -(depth / 2 - wallThick / 2));
    sLeft.castShadow = true;
    g.add(sLeft);
    const sRight = mesh(new THREE.BoxGeometry(sideW, height, wallThick), wallMat);
    sRight.position.set( (doorW / 2 + sideW / 2), wallY, -(depth / 2 - wallThick / 2));
    sRight.castShadow = true;
    g.add(sRight);
  }

  // East wall
  const eWall = mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
  eWall.position.set(width / 2 - wallThick / 2, wallY, 0);
  eWall.castShadow = true; eWall.receiveShadow = true;

  // West wall
  const wWall = mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
  wWall.position.set(-(width / 2 - wallThick / 2), wallY, 0);
  wWall.castShadow = true; wWall.receiveShadow = true;

  g.add(nWall, eWall, wWall);
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
