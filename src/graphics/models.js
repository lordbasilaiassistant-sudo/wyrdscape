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
  bootBox:    new THREE.BoxGeometry(0.30, 0.16, 0.34),  // sits below the leg, slightly wider
  hairCap:    new THREE.BoxGeometry(0.65, 0.18, 0.65),

  // Cow
  cowBody:    new THREE.BoxGeometry(1.6, 0.9, 0.8),
  cowLeg:     new THREE.BoxGeometry(0.22, 0.7, 0.22),
  cowHoof:    new THREE.BoxGeometry(0.26, 0.10, 0.26),
  cowHead:    new THREE.BoxGeometry(0.55, 0.55, 0.55),
  cowHornCyl: new THREE.CylinderGeometry(0.06, 0.04, 0.32, 6),
  cowSpot:    new THREE.BoxGeometry(0.5, 0.06, 0.36),
  cowUdder:   new THREE.BoxGeometry(0.3, 0.18, 0.22),
  cowTeat:    new THREE.CylinderGeometry(0.04, 0.03, 0.10, 5),
  cowTail:    new THREE.BoxGeometry(0.08, 0.5, 0.08),

  // Chicken
  chickenBodySphere: new THREE.SphereGeometry(0.26, 8, 6),
  chickenHeadSphere: new THREE.SphereGeometry(0.16, 6, 5),
  chickenComb:       new THREE.BoxGeometry(0.08, 0.12, 0.20),
  chickenWattle:     new THREE.BoxGeometry(0.06, 0.08, 0.06),
  chickenBeakCone:   new THREE.ConeGeometry(0.06, 0.16, 5),
  chickenLeg:        new THREE.BoxGeometry(0.05, 0.20, 0.05),
  chickenTailFeather:new THREE.ConeGeometry(0.10, 0.22, 4),

  // Goblin
  goblinEar:       new THREE.ConeGeometry(0.10, 0.26, 4),  // bigger pointed ears
  goblinFang:      new THREE.ConeGeometry(0.025, 0.06, 4),
  goblinClaw:      new THREE.ConeGeometry(0.025, 0.07, 4),
  goblinScrap:     new THREE.BoxGeometry(0.16, 0.10, 0.05),
  goblinBuckleGeo: new THREE.BoxGeometry(0.10, 0.10, 0.05),

  // Tree
  treeTrunk:      new THREE.CylinderGeometry(0.32, 0.5, 2.0, 8),  // more flared root
  treeFoliage:    new THREE.SphereGeometry(1.2, 8, 6),
  treeFoliageMid: new THREE.SphereGeometry(0.9, 7, 5),
  treeFoliageTop: new THREE.SphereGeometry(0.7, 6, 5),
  treeBranch:     new THREE.CylinderGeometry(0.06, 0.08, 0.55, 5),
  oakTrunk:       new THREE.CylinderGeometry(0.5, 0.85, 2.6, 10),  // bigger root flare
  oakFoliage:     new THREE.SphereGeometry(1.7, 10, 7),
  oakFoliageMid:  new THREE.SphereGeometry(1.25, 8, 6),
  oakFoliageTop:  new THREE.SphereGeometry(0.9, 7, 5),
  treeStump:      new THREE.CylinderGeometry(0.45, 0.55, 0.45, 8),

  // Item drops
  logDrop:      new THREE.CylinderGeometry(0.13, 0.13, 0.55, 8),
  logEnd:       new THREE.CylinderGeometry(0.115, 0.115, 0.04, 8),  // end-grain rings
  logGrain:     new THREE.BoxGeometry(0.02, 0.4, 0.02),
  coinDisk:     new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
  meatDrop:     new THREE.BoxGeometry(0.34, 0.18, 0.24),
  boneDrop:     new THREE.BoxGeometry(0.4,  0.1,  0.1),
  boneSkull:    new THREE.BoxGeometry(0.18, 0.16, 0.16),
  boneCross:    new THREE.BoxGeometry(0.32, 0.06, 0.06),
  fishBody:     new THREE.BoxGeometry(0.45, 0.16, 0.16),
  fishTailFin:  new THREE.ConeGeometry(0.12, 0.18, 4),
  fishDorsal:   new THREE.ConeGeometry(0.08, 0.12, 4),
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

  // ---- LEGS ------------------------------------------------
  // Hip pivots at y=0.85. Each leg has a fabric thigh + a darker boot
  // at the bottom so the player has visible footwear from above.
  const lLeg = new THREE.Group();
  lLeg.name = 'leftLeg';
  lLeg.position.set(-0.18, 0.85, 0);
  const lLegMesh = mesh(GEO.legBox, legMat);
  lLegMesh.position.y = -0.425;
  lLeg.add(lLegMesh);
  const lBoot = mesh(GEO.bootBox, MAT.bootDark);
  lBoot.position.set(0, -0.77, 0.04);
  lLeg.add(lBoot);

  const rLeg = new THREE.Group();
  rLeg.name = 'rightLeg';
  rLeg.position.set(0.18, 0.85, 0);
  const rLegMesh = mesh(GEO.legBox, legMat);
  rLegMesh.position.y = -0.425;
  rLeg.add(rLegMesh);
  const rBoot = mesh(GEO.bootBox, MAT.bootDark);
  rBoot.position.set(0, -0.77, 0.04);
  rLeg.add(rBoot);

  // ---- TORSO -----------------------------------------------
  // Layered: main tunic + darker collar trim across the shoulders
  // and a darker belt across the waist.
  const torso = mesh(GEO.torsoBox, tunicMat);
  torso.name = 'body';
  torso.position.set(0, 1.30, 0);

  // Collar trim — thin slab across the top of the torso
  const collar = mesh(
    new THREE.BoxGeometry(0.74, 0.10, 0.44),
    _matFor(_darkerHex(options.tunicColor || 0x355c9a)) || MAT.tunicBlueDark
  );
  collar.position.set(0, 1.72, 0);
  collar.castShadow = true;

  // Belt — darker thin band at the waist
  const belt = mesh(
    new THREE.BoxGeometry(0.74, 0.13, 0.44),
    MAT.leatherBrown
  );
  belt.position.set(0, 0.95, 0);
  belt.castShadow = true;

  // Belt buckle — small bronze square in front
  const buckle = mesh(
    new THREE.BoxGeometry(0.12, 0.10, 0.06),
    MAT.metalBronze
  );
  buckle.position.set(0, 0.95, 0.22);

  // ---- ARMS ------------------------------------------------
  // Shoulder pivots at y=1.725, arm hangs below.
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

  // ---- HEAD ------------------------------------------------
  // The head is itself a Group so we can give it eyes/nose/mouth as
  // children that move with it during head-look animations. The
  // animator searches by `name === 'head'`, and a Group with that
  // name resolves the same way as a Mesh.
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0, 2.05, 0);

  const skullMesh = mesh(GEO.headBox, MAT.skin);
  skullMesh.castShadow = true;
  head.add(skullMesh);

  // Eyes — two tiny dark pixels on the front (+Z) face
  const eyeGeo = new THREE.BoxGeometry(0.07, 0.07, 0.04);
  const lEye = mesh(eyeGeo, MAT.eyeBlack, false);
  lEye.position.set(-0.13, 0.05, 0.31);
  head.add(lEye);
  const rEye = mesh(eyeGeo, MAT.eyeBlack, false);
  rEye.position.set( 0.13, 0.05, 0.31);
  head.add(rEye);

  // Nose — small skin bump in the center
  const nose = mesh(new THREE.BoxGeometry(0.08, 0.10, 0.06), MAT.skinShade, false);
  nose.position.set(0, -0.04, 0.32);
  head.add(nose);

  // Mouth — thin dark line below the nose
  const mouth = mesh(new THREE.BoxGeometry(0.16, 0.03, 0.03), MAT.eyeBlack, false);
  mouth.position.set(0, -0.16, 0.32);
  head.add(mouth);

  // Hair — base cap + a small tuft on top so it isn't a flat slab
  const hair = mesh(GEO.hairCap, hairMat);
  hair.name = 'hair';
  hair.position.set(0, 2.40, 0);
  const hairTuft = mesh(
    new THREE.BoxGeometry(0.36, 0.16, 0.36),
    hairMat
  );
  hairTuft.position.set(0.05, 2.55, 0);

  g.add(lLeg, rLeg, torso, collar, belt, buckle, lArm, rArm, head, hair, hairTuft);

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

// Lighten/darken a hex color by a multiplicative factor in 0..1.
// Used to derive collar/belt trim from a player's tunic color.
function _darkerHex(hex, factor = 0.62) {
  if (typeof hex !== 'number') return null;
  const r = Math.max(0, Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor)));
  const g = Math.max(0, Math.min(255, Math.floor(((hex >>  8) & 0xff) * factor)));
  const b = Math.max(0, Math.min(255, Math.floor(((hex      ) & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

/**
 * Goblin — green-skinned humanoid, slightly smaller than the player,
 * hunched posture, leather scraps, fanged mouth, big pointed ears,
 * dull brass belt buckle.
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
  const lLegMesh = mesh(GEO.legBox, MAT.goblinGreenDark);
  lLegMesh.position.y = -0.34;
  lLegMesh.scale.set(0.85, 0.8, 0.85);
  lLeg.add(lLegMesh);

  const rLeg = new THREE.Group();
  rLeg.name = 'rightLeg';
  rLeg.position.set(0.15, gobLegY, 0);
  const rLegMesh = mesh(GEO.legBox, MAT.goblinGreenDark);
  rLegMesh.position.y = -0.34;
  rLegMesh.scale.set(0.85, 0.8, 0.85);
  rLeg.add(rLegMesh);

  // Hunched posture: tilt the torso slightly forward (around X axis)
  // and shift it forward a hair so the head ends up over the toes.
  const torsoPivot = new THREE.Group();
  torsoPivot.name = 'body';
  torsoPivot.position.set(0, 1.05, 0);
  torsoPivot.rotation.x = 0.18; // ~10° hunch

  const torso = mesh(GEO.torsoBox, MAT.leatherBrown);
  torso.scale.set(0.85, 0.85, 0.85);
  torsoPivot.add(torso);

  // Leather scraps stitched onto the tunic — small dark plates
  const scrap1 = mesh(GEO.goblinScrap, MAT.goblinScrap);
  scrap1.position.set(-0.18, 0.05, 0.18);
  scrap1.rotation.z = 0.15;
  torsoPivot.add(scrap1);
  const scrap2 = mesh(GEO.goblinScrap, MAT.goblinScrap);
  scrap2.position.set(0.16, -0.10, 0.18);
  scrap2.rotation.z = -0.20;
  torsoPivot.add(scrap2);
  const scrap3 = mesh(new THREE.BoxGeometry(0.10, 0.18, 0.05), MAT.goblinScrap);
  scrap3.position.set(0.0, 0.18, 0.20);
  torsoPivot.add(scrap3);

  // Belt with buckle across the torso bottom
  const belt = mesh(
    new THREE.BoxGeometry(0.65, 0.10, 0.40),
    MAT.goblinScrap,
  );
  belt.position.set(0, -0.30, 0);
  torsoPivot.add(belt);
  const buckle = mesh(GEO.goblinBuckleGeo, MAT.goblinBuckle);
  buckle.position.set(0, -0.30, 0.22);
  torsoPivot.add(buckle);

  // Shoulder pivots ~= torso top (~1.05 + 0.45*0.85 = ~1.43).
  // We keep arm pivots at world coordinates (siblings of torso) so
  // the animator's existing limb rotations still apply correctly.
  const gobArmY = 1.40;
  const lArm = new THREE.Group();
  lArm.name = 'leftArm';
  lArm.position.set(-0.38, gobArmY, 0.05);
  const lArmMesh = mesh(GEO.armBox, MAT.goblinGreen);
  lArmMesh.position.y = -0.36;
  lArmMesh.scale.set(0.9, 0.85, 0.9);
  lArm.add(lArmMesh);
  // Three small claws at the bottom of the left arm
  for (let i = -1; i <= 1; i++) {
    const claw = mesh(GEO.goblinClaw, MAT.eyeBlack, false);
    claw.position.set(i * 0.06, -0.78, 0.02);
    claw.rotation.x = Math.PI; // point downward
    lArm.add(claw);
  }

  const rArm = new THREE.Group();
  rArm.name = 'rightArm';
  rArm.position.set(0.38, gobArmY, 0.05);
  const rArmMesh = mesh(GEO.armBox, MAT.goblinGreen);
  rArmMesh.position.y = -0.36;
  rArmMesh.scale.set(0.9, 0.85, 0.9);
  rArm.add(rArmMesh);
  for (let i = -1; i <= 1; i++) {
    const claw = mesh(GEO.goblinClaw, MAT.eyeBlack, false);
    claw.position.set(i * 0.06, -0.78, 0.02);
    claw.rotation.x = Math.PI;
    rArm.add(claw);
  }

  // Head — Group so we can pin face details to it
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.05, 1.66, 0.05); // shifted slightly forward to match hunch
  const skull = mesh(GEO.headBox, MAT.goblinGreen);
  skull.scale.set(0.85, 0.85, 0.85);
  head.add(skull);

  // Eyes — small angry-yellow blocks
  const eyeYellowMat = new THREE.MeshLambertMaterial({ color: 0xf5d23a });
  const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.04);
  const lEye = mesh(eyeGeo, eyeYellowMat, false);
  lEye.position.set(-0.10, 0.04, 0.27);
  head.add(lEye);
  const rEye = mesh(eyeGeo, eyeYellowMat, false);
  rEye.position.set( 0.10, 0.04, 0.27);
  head.add(rEye);

  // Mouth — thin dark slash
  const gobMouth = mesh(new THREE.BoxGeometry(0.18, 0.03, 0.03), MAT.eyeBlack, false);
  gobMouth.position.set(0, -0.10, 0.27);
  head.add(gobMouth);

  // Two small fangs poking down from the mouth
  const lFang = mesh(GEO.goblinFang, MAT.toothWhite, false);
  lFang.position.set(-0.05, -0.16, 0.27);
  lFang.rotation.x = Math.PI;
  head.add(lFang);
  const rFang = mesh(GEO.goblinFang, MAT.toothWhite, false);
  rFang.position.set( 0.05, -0.16, 0.27);
  rFang.rotation.x = Math.PI;
  head.add(rFang);

  // Bigger pointy ears (cones rotated to stick out sideways)
  const lEar = mesh(GEO.goblinEar, MAT.goblinGreen);
  lEar.position.set(-0.28, 0.05, 0);
  lEar.rotation.z =  Math.PI / 2;
  head.add(lEar);
  const rEar = mesh(GEO.goblinEar, MAT.goblinGreen);
  rEar.position.set( 0.28, 0.05, 0);
  rEar.rotation.z = -Math.PI / 2;
  head.add(rEar);

  g.add(lLeg, rLeg, torsoPivot, lArm, rArm, head);
  return g;
}

// =============================================================
// ANIMALS
// =============================================================

/**
 * Cow — boxy quadruped with brown legs, white body, black spots,
 * curved horns, pink udder, and a swishing tail.
 */
export function createCowModel() {
  const g = new THREE.Group();
  g.name = 'cow';

  // Body
  const body = mesh(GEO.cowBody, MAT.cowWhite);
  body.name = 'body';
  body.position.set(0, 0.95, 0);

  // 4 legs with hooves at the bottom. Each leg is a pivot group so the
  // animator can rotate each one around the hip; the hoof rides along.
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
    const l = mesh(GEO.cowLeg, MAT.cowWhite);
    l.position.y = -0.35;
    pivot.add(l);
    // Hoof — small dark cap at the bottom of the leg
    const hoof = mesh(GEO.cowHoof, MAT.hoofBrown);
    hoof.position.y = -0.65;
    pivot.add(hoof);
    return pivot;
  });

  // Head (front of body, +X side)
  const head = mesh(GEO.cowHead, MAT.cowWhite);
  head.name = 'head';
  head.position.set(0.95, 1.05, 0);

  // Snout — a smaller pink/skin block on the front of the head
  const snout = mesh(new THREE.BoxGeometry(0.30, 0.22, 0.36), MAT.cowUdderPink);
  snout.position.set(1.18, 0.95, 0);

  // Eyes — two tiny dark pixels on the head
  const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.04);
  const lEye = mesh(eyeGeo, MAT.eyeBlack, false);
  lEye.position.set(1.13, 1.16,  0.16);
  const rEye = mesh(eyeGeo, MAT.eyeBlack, false);
  rEye.position.set(1.13, 1.16, -0.16);

  // Curved horns — short cylinders on top of the head, tilted out
  const lHorn = mesh(GEO.cowHornCyl, MAT.boneTan);
  lHorn.position.set(0.95, 1.42,  0.22);
  lHorn.rotation.z = -Math.PI / 6;
  lHorn.rotation.x = -Math.PI / 12;
  const rHorn = mesh(GEO.cowHornCyl, MAT.boneTan);
  rHorn.position.set(0.95, 1.42, -0.22);
  rHorn.rotation.z = -Math.PI / 6;
  rHorn.rotation.x =  Math.PI / 12;

  // Black spots — fewer but larger and more angular
  const spotPositions = [
    [-0.4,  1.42,  0.10],
    [ 0.25, 1.42, -0.18],
    [-0.1,  1.42,  0.32],
    [ 0.15, 0.95, -0.42],  // side spot
  ];
  const spots = spotPositions.map(([x, y, z]) => {
    const s = mesh(GEO.cowSpot, MAT.cowBlack);
    s.position.set(x, y, z);
    // Slight rotation so spots aren't all axis-aligned
    s.rotation.y = (x * 7) % 1 * 0.5;
    return s;
  });

  // Pink udder — small box under the back of the body
  const udder = mesh(GEO.cowUdder, MAT.cowUdderPink);
  udder.position.set(-0.45, 0.55, 0);

  // 4 small teats hanging from the udder
  const teatPositions = [
    [-0.55, 0.42,  0.06],
    [-0.55, 0.42, -0.06],
    [-0.35, 0.42,  0.06],
    [-0.35, 0.42, -0.06],
  ];
  const teats = teatPositions.map(([x, y, z]) => {
    const t = mesh(GEO.cowTeat, MAT.cowUdderPink, false);
    t.position.set(x, y, z);
    return t;
  });

  // Tail — thin box hanging off the back, slightly tilted so it
  // reads as drooping rather than rigid.
  const tail = mesh(GEO.cowTail, MAT.cowWhite);
  tail.position.set(-0.85, 1.15, 0);
  tail.rotation.z = Math.PI / 8;
  // Dark tuft at the bottom of the tail
  const tailTuft = mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), MAT.cowBlack);
  tailTuft.position.set(-0.96, 0.92, 0);

  g.add(
    body, ...legs,
    head, snout, lEye, rEye,
    lHorn, rHorn,
    ...spots,
    udder, ...teats,
    tail, tailTuft,
  );
  return g;
}

/**
 * Chicken — round-bodied white bird with comb, wattle, beak, and a
 * fanned tail. Body is a rear sphere + a slightly larger main sphere
 * so the silhouette is round, not boxy.
 */
export function createChickenModel() {
  const g = new THREE.Group();
  g.name = 'chicken';

  // Body group so the animator finds 'body' as a node it can rotate.
  const body = new THREE.Group();
  body.name = 'body';
  body.position.set(0, 0.40, 0);

  const torsoSphere = mesh(GEO.chickenBodySphere, MAT.chickenWhite);
  torsoSphere.scale.set(1.1, 1.0, 1.0);
  torsoSphere.position.set(0, 0, 0);
  body.add(torsoSphere);

  // Rear belly bulge — second slightly smaller sphere
  const rear = mesh(GEO.chickenBodySphere, MAT.chickenWhite);
  rear.scale.set(0.9, 0.85, 0.95);
  rear.position.set(-0.18, -0.04, 0);
  body.add(rear);

  // Tail feathers — three small upward cones at the back
  const tailColors = [MAT.chickenWhite, MAT.chickenWhite, MAT.chickenWhite];
  const tailOffsets = [
    [-0.32, 0.08,  0.0,  0.20],
    [-0.36, 0.18,  0.10, 0.05],
    [-0.36, 0.18, -0.10,-0.05],
  ];
  tailOffsets.forEach(([x, y, z, tilt], i) => {
    const f = mesh(GEO.chickenTailFeather, tailColors[i]);
    f.position.set(x, y, z);
    f.rotation.z =  Math.PI / 2 + tilt;
    f.rotation.y = -tilt * 0.5;
    body.add(f);
  });

  // Head — Group with eyes, comb, wattle, beak as children so the
  // animator's `head` node can rotate the whole face together.
  const head = new THREE.Group();
  head.name = 'head';
  head.position.set(0.22, 0.30, 0);

  const skull = mesh(GEO.chickenHeadSphere, MAT.chickenWhite);
  head.add(skull);

  // Comb on top — a slightly larger red block
  const comb = mesh(GEO.chickenComb, MAT.chickenRed);
  comb.position.set(0, 0.16, 0);
  head.add(comb);

  // Wattle hanging below the beak
  const wattle = mesh(GEO.chickenWattle, MAT.chickenWattle);
  wattle.position.set(0.10, -0.13, 0);
  head.add(wattle);

  // Eyes — two tiny dark dots
  const eyeGeo = new THREE.BoxGeometry(0.03, 0.03, 0.03);
  const lEye = mesh(eyeGeo, MAT.eyeBlack, false);
  lEye.position.set(0.08, 0.04,  0.10);
  head.add(lEye);
  const rEye = mesh(eyeGeo, MAT.eyeBlack, false);
  rEye.position.set(0.08, 0.04, -0.10);
  head.add(rEye);

  // Beak — small orange cone pointing forward
  const beak = mesh(GEO.chickenBeakCone, MAT.beak);
  beak.position.set(0.18, 0, 0);
  beak.rotation.z = -Math.PI / 2;
  head.add(beak);

  // Legs — slightly forward of the body center, so the silhouette
  // looks like a chicken standing on the front of its torso.
  const lLeg = mesh(GEO.chickenLeg, MAT.beak);
  lLeg.name = 'leftLeg';
  lLeg.position.set(0.03, 0.10,  0.08);
  const rLeg = mesh(GEO.chickenLeg, MAT.beak);
  rLeg.name = 'rightLeg';
  rLeg.position.set(0.03, 0.10, -0.08);

  // Tiny feet — flat boxes at the bottom
  const lFoot = mesh(new THREE.BoxGeometry(0.10, 0.03, 0.10), MAT.beak, false);
  lFoot.position.set(0.03, 0.015, 0.08);
  const rFoot = mesh(new THREE.BoxGeometry(0.10, 0.03, 0.10), MAT.beak, false);
  rFoot.position.set(0.03, 0.015, -0.08);

  g.add(body, head, lLeg, rLeg, lFoot, rFoot);
  return g;
}

// =============================================================
// TREES / NATURE
// =============================================================

/**
 * Standard tree — flared trunk + 3-tier foliage with color variation
 * and visible branches under the canopy. Total height ~4.
 */
export function createTreeModel() {
  const g = new THREE.Group();
  g.name = 'tree';

  const trunk = mesh(GEO.treeTrunk, MAT.trunkBrown);
  trunk.position.set(0, 1.0, 0);
  g.add(trunk);

  // Two small branches sticking out from the trunk under the foliage
  const lBranch = mesh(GEO.treeBranch, MAT.branchBrown);
  lBranch.position.set(-0.32, 1.55, 0);
  lBranch.rotation.z = Math.PI / 3;
  g.add(lBranch);
  const rBranch = mesh(GEO.treeBranch, MAT.branchBrown);
  rBranch.position.set(0.32, 1.45, 0.05);
  rBranch.rotation.z = -Math.PI / 3;
  g.add(rBranch);
  const bBranch = mesh(GEO.treeBranch, MAT.branchBrown);
  bBranch.position.set(0.05, 1.7, -0.32);
  bBranch.rotation.x = Math.PI / 3;
  g.add(bBranch);

  // Main foliage ball — base tier, mid-green
  const foliage = mesh(GEO.treeFoliage, MAT.leafGreen);
  foliage.position.set(0, 2.55, 0);
  g.add(foliage);

  // Lighter highlight blob top-front
  const highlight = mesh(GEO.treeFoliageMid, MAT.leafGreenLt);
  highlight.position.set(0.35, 3.05, 0.30);
  g.add(highlight);

  // Darker shadow blob bottom-back
  const shadowBlob = mesh(GEO.treeFoliageMid, MAT.leafGreenDk);
  shadowBlob.position.set(-0.35, 2.40, -0.30);
  g.add(shadowBlob);

  // Small top blob to break the silhouette
  const topBlob = mesh(GEO.treeFoliageTop, MAT.leafGreen);
  topBlob.position.set(0.0, 3.35, 0.0);
  g.add(topBlob);

  return g;
}

/**
 * Oak tree — bigger, darker foliage, thicker gnarled trunk, more
 * pronounced root flare. Total height ~5.
 */
export function createOakTreeModel() {
  const g = new THREE.Group();
  g.name = 'oak-tree';

  const trunk = mesh(GEO.oakTrunk, MAT.oakTrunkDark);
  trunk.position.set(0, 1.3, 0);
  // Slight twist on the trunk so it looks gnarled
  trunk.scale.x = 1.05;
  trunk.rotation.y = 0.18;
  g.add(trunk);

  // Larger branches than the standard tree
  const branches = [
    [-0.45, 1.95,  0.05,  0,  Math.PI / 3, 0],
    [ 0.45, 1.85,  0.10,  0, -Math.PI / 3, 0],
    [ 0.05, 2.10, -0.45,  Math.PI / 3, 0, 0],
    [-0.10, 2.20,  0.42, -Math.PI / 3, 0, 0],
  ];
  branches.forEach(([x, y, z, rx, rz, ry]) => {
    const b = mesh(
      new THREE.CylinderGeometry(0.08, 0.10, 0.7, 5),
      MAT.branchBrown,
    );
    b.position.set(x, y, z);
    b.rotation.set(rx, ry, rz);
    g.add(b);
  });

  // 4-tier foliage — main + 3 accent blobs at varied heights and tints
  const main = mesh(GEO.oakFoliage, MAT.leafDark);
  main.position.set(0, 3.3, 0);
  g.add(main);

  const accentA = mesh(GEO.oakFoliageMid, MAT.leafDarkLt);
  accentA.position.set(0.55, 3.85, 0.45);
  g.add(accentA);

  const accentB = mesh(GEO.oakFoliageMid, MAT.leafDark);
  accentB.position.set(-0.50, 3.05, -0.45);
  g.add(accentB);

  const accentC = mesh(GEO.oakFoliageTop, MAT.leafDarkLt);
  accentC.position.set(0.10, 4.30, 0.10);
  g.add(accentC);

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
 * Rock node for mining. Angular chunky stone with a few faceted bumps
 * and visible ore vein highlights — chiseled, not smooth.
 *
 * Optional oreColor tints visible veins so players can tell copper /
 * tin / iron apart at a glance.
 */
export function createRockNodeModel(oreColor = 0x9a6a4a) {
  const g = new THREE.Group();
  g.name = 'rock-node';

  // Base — a low octahedron-ish chunk made of two rotated boxes for
  // a more angular silhouette than a smooth cylinder.
  const base1 = mesh(
    new THREE.BoxGeometry(1.4, 0.85, 1.2),
    MAT.stoneGrey,
  );
  base1.position.y = 0.42;
  base1.rotation.y = 0.25;
  g.add(base1);

  const base2 = mesh(
    new THREE.BoxGeometry(1.1, 0.55, 1.4),
    MAT.stoneDark,
  );
  base2.position.y = 0.55;
  base2.rotation.y = -0.45;
  g.add(base2);

  // Top crag — a smaller box rotated to add a peak
  const peak = mesh(
    new THREE.BoxGeometry(0.6, 0.55, 0.6),
    MAT.stoneGrey,
  );
  peak.position.set(0.05, 0.95, -0.1);
  peak.rotation.y = 0.6;
  peak.rotation.z = 0.18;
  g.add(peak);

  // Side facets — small angular bumps on the front and back
  const facetGeo = new THREE.BoxGeometry(0.5, 0.4, 0.4);
  const f1 = mesh(facetGeo, MAT.stoneGrey);
  f1.position.set(-0.55, 0.55, 0.45);
  f1.rotation.y = 0.45;
  g.add(f1);
  const f2 = mesh(facetGeo, MAT.stoneDark);
  f2.position.set(0.55, 0.45, -0.45);
  f2.rotation.y = -0.6;
  g.add(f2);

  // Ore veins — three small bright bits scattered across the surface,
  // sharing one material per node so the cost is one extra material
  // per spawned rock rather than three.
  const veinMat = new THREE.MeshLambertMaterial({
    color: oreColor,
    emissive: oreColor,
    emissiveIntensity: 0.18,
  });
  const veinSpecs = [
    [ 0.05, 0.95,  0.45, 0.22, 0.18, 0.22],
    [-0.50, 0.85, -0.10, 0.16, 0.14, 0.16],
    [ 0.45, 0.30,  0.30, 0.18, 0.12, 0.18],
  ];
  veinSpecs.forEach(([x, y, z, w, h, d]) => {
    const vein = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), veinMat);
    vein.position.set(x, y, z);
    vein.castShadow = true;
    g.add(vein);
  });

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
 * window slits, door frame, chimney, and a thatched eave rim around
 * the top. The center of the roof stays open so the iso camera looks
 * down INTO the room (like OSRS with the roof culled).
 *
 * Origin sits at the floor center, so callers can place with
 * `.position.set(x, 0, z)`.
 *
 * @param {number} width  - X size in world units
 * @param {number} depth  - Z size
 * @param {number} height - wall height (eaves sit on top)
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

  // A few darker plank lines along the floor for visible grain
  const plankCount = Math.max(2, Math.round(width / 1.0));
  for (let i = 1; i < plankCount; i++) {
    const seam = mesh(
      new THREE.BoxGeometry(0.04, 0.005, depth - 0.2),
      MAT.logBrownDk,
      false, true,
    );
    seam.position.set(-width / 2 + (i * width / plankCount), 0.124, 0);
    g.add(seam);
  }

  // Four thin stone walls. Each wall is a thin BoxGeometry.
  const wallThick = 0.18;
  const wallY = 0.12 + height / 2;
  const wallMat = MAT.stoneGrey;

  // ---- North wall (at +Z edge) with two window slits ----
  const nWall = mesh(new THREE.BoxGeometry(width, height, wallThick), wallMat);
  nWall.position.set(0, wallY, depth / 2 - wallThick / 2);
  nWall.castShadow = true; nWall.receiveShadow = true;
  g.add(nWall);

  // Window slits — small dark boxes inset slightly into the wall face.
  // Two on the north side, evenly spaced.
  const winGeo = new THREE.BoxGeometry(0.35, 0.5, 0.05);
  for (const offX of [-width / 4, width / 4]) {
    const win = mesh(winGeo, MAT.stoneDark, false);
    win.position.set(offX, wallY + 0.2, depth / 2 - wallThick + 0.001);
    g.add(win);
  }

  // ---- South wall with a centered doorway gap and wood frame ----
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

    // Wooden door frame around the gap — left jamb, right jamb, lintel
    const jambGeo = new THREE.BoxGeometry(0.10, height - 0.4, 0.22);
    const lJamb = mesh(jambGeo, MAT.trunkBrown);
    lJamb.position.set(-doorW / 2, 0.12 + (height - 0.4) / 2, -(depth / 2 - wallThick + 0.02));
    g.add(lJamb);
    const rJamb = mesh(jambGeo, MAT.trunkBrown);
    rJamb.position.set( doorW / 2, 0.12 + (height - 0.4) / 2, -(depth / 2 - wallThick + 0.02));
    g.add(rJamb);
    const lintel = mesh(
      new THREE.BoxGeometry(doorW + 0.2, 0.18, 0.22),
      MAT.trunkBrown,
    );
    lintel.position.set(0, 0.12 + (height - 0.4) - 0.05, -(depth / 2 - wallThick + 0.02));
    g.add(lintel);
  }

  // ---- East wall with one window slit ----
  const eWall = mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
  eWall.position.set(width / 2 - wallThick / 2, wallY, 0);
  eWall.castShadow = true; eWall.receiveShadow = true;
  g.add(eWall);
  const eWin = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.35), MAT.stoneDark, false);
  eWin.position.set(width / 2 - wallThick + 0.001, wallY + 0.2, 0);
  g.add(eWin);

  // ---- West wall with one window slit ----
  const wWall = mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
  wWall.position.set(-(width / 2 - wallThick / 2), wallY, 0);
  wWall.castShadow = true; wWall.receiveShadow = true;
  g.add(wWall);
  const wWin = mesh(new THREE.BoxGeometry(0.05, 0.5, 0.35), MAT.stoneDark, false);
  wWin.position.set(-(width / 2 - wallThick) - 0.001, wallY + 0.2, 0);
  g.add(wWin);

  // ---- Thatched eave rim around the top ----
  // A thin perimeter ring that overhangs the walls slightly. We use
  // four boxes (one per wall) so the iso camera still sees through
  // the open center down into the room. Color: thatch tan.
  const eaveOver = 0.25;
  const eaveH = 0.24;
  const eaveY = 0.12 + height + eaveH / 2;

  const eaveN = mesh(
    new THREE.BoxGeometry(width + eaveOver * 2, eaveH, eaveOver + wallThick),
    MAT.thatchTan,
  );
  eaveN.position.set(0, eaveY, depth / 2 - wallThick / 2 + eaveOver / 2);
  g.add(eaveN);

  const eaveS = mesh(
    new THREE.BoxGeometry(width + eaveOver * 2, eaveH, eaveOver + wallThick),
    MAT.thatchTan,
  );
  eaveS.position.set(0, eaveY, -(depth / 2 - wallThick / 2 + eaveOver / 2));
  g.add(eaveS);

  const eaveE = mesh(
    new THREE.BoxGeometry(eaveOver + wallThick, eaveH, depth - wallThick),
    MAT.thatchTan,
  );
  eaveE.position.set(width / 2 - wallThick / 2 + eaveOver / 2, eaveY, 0);
  g.add(eaveE);

  const eaveW = mesh(
    new THREE.BoxGeometry(eaveOver + wallThick, eaveH, depth - wallThick),
    MAT.thatchTan,
  );
  eaveW.position.set(-(width / 2 - wallThick / 2 + eaveOver / 2), eaveY, 0);
  g.add(eaveW);

  // Dark band along the bottom of the eaves so the thatch reads as
  // straw bundles, not a flat slab.
  const bandGeo = new THREE.BoxGeometry(width + eaveOver * 2 + 0.04, 0.06, 0.04);
  const bandN = mesh(bandGeo, MAT.thatchDark);
  bandN.position.set(0, eaveY - eaveH / 2 - 0.01, depth / 2 + eaveOver - 0.02);
  g.add(bandN);
  const bandS = mesh(bandGeo, MAT.thatchDark);
  bandS.position.set(0, eaveY - eaveH / 2 - 0.01, -(depth / 2 + eaveOver - 0.02));
  g.add(bandS);

  // ---- Chimney on the north-east corner ----
  const chimGeo = new THREE.BoxGeometry(0.45, 1.0, 0.45);
  const chimney = mesh(chimGeo, MAT.stoneGrey);
  chimney.position.set(width / 2 - 0.45, 0.12 + height + 0.5, depth / 2 - 0.45);
  g.add(chimney);
  // Chimney top — a darker thin box to read as a soot-stained mouth
  const chimTop = mesh(
    new THREE.BoxGeometry(0.50, 0.08, 0.50),
    MAT.stoneDark,
  );
  chimTop.position.set(width / 2 - 0.45, 0.12 + height + 1.04, depth / 2 - 0.45);
  g.add(chimTop);

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

  // Main log lying on its side
  const log = mesh(GEO.logDrop, MAT.logBrown);
  log.position.y = 0.12;
  log.rotation.z = Math.PI / 2;
  g.add(log);

  // End-grain rings — slightly darker disks at each end
  const lEnd = mesh(GEO.logEnd, MAT.logBrownDk, false);
  lEnd.position.set(-0.275, 0.12, 0);
  lEnd.rotation.z = Math.PI / 2;
  g.add(lEnd);
  const rEnd = mesh(GEO.logEnd, MAT.logBrownDk, false);
  rEnd.position.set(0.275, 0.12, 0);
  rEnd.rotation.z = Math.PI / 2;
  g.add(rEnd);

  // Two grain stripes along the side of the log
  for (const off of [0.05, -0.05]) {
    const grain = mesh(GEO.logGrain, MAT.logBrownDk, false);
    grain.position.set(0, 0.12 + off, 0.10);
    grain.rotation.z = Math.PI / 2;
    g.add(grain);
  }

  return g;
}

export function createCoinDrop() {
  const g = new THREE.Group();
  g.name = 'coin-drop';

  // Stack of 3 disks — alternating gold and a slightly darker shadow ring
  const c1 = mesh(GEO.coinDisk, MAT.coinGold);
  c1.position.y = 0.04;
  g.add(c1);
  const c2 = mesh(GEO.coinDisk, MAT.coinGoldDk, false);
  c2.position.y = 0.09;
  c2.scale.set(0.96, 0.6, 0.96);
  g.add(c2);
  const c3 = mesh(GEO.coinDisk, MAT.coinGold);
  c3.position.y = 0.14;
  g.add(c3);

  return g;
}

export function createMeatDrop() {
  const g = new THREE.Group();
  g.name = 'meat-drop';
  const meat = mesh(GEO.meatDrop, MAT.meatRed);
  meat.position.y = 0.09;
  g.add(meat);
  // Small bone tip sticking out (drumstick look)
  const bone = mesh(new THREE.BoxGeometry(0.10, 0.05, 0.05), MAT.boneTan, false);
  bone.position.set(0.20, 0.12, 0);
  g.add(bone);
  return g;
}

export function createBoneDrop() {
  const g = new THREE.Group();
  g.name = 'bone-drop';

  // Skull on top
  const skull = mesh(GEO.boneSkull, MAT.boneTan);
  skull.position.set(0, 0.18, 0);
  g.add(skull);
  // Two tiny eye sockets in the skull
  const socketGeo = new THREE.BoxGeometry(0.04, 0.04, 0.02);
  const lSock = mesh(socketGeo, MAT.eyeBlack, false);
  lSock.position.set(-0.04, 0.20, 0.08);
  g.add(lSock);
  const rSock = mesh(socketGeo, MAT.eyeBlack, false);
  rSock.position.set(0.04, 0.20, 0.08);
  g.add(rSock);

  // Two crossed bones underneath
  const crossA = mesh(GEO.boneCross, MAT.boneTan);
  crossA.position.set(0, 0.06, 0);
  crossA.rotation.y = Math.PI / 4;
  g.add(crossA);
  const crossB = mesh(GEO.boneCross, MAT.boneTan);
  crossB.position.set(0, 0.06, 0);
  crossB.rotation.y = -Math.PI / 4;
  g.add(crossB);

  return g;
}

/**
 * Fish drop — streamlined silver body with a fan tail and dorsal fin.
 * Used for fishing skill drops. main.js doesn't reference this yet but
 * it's exported for future use.
 */
export function createFishDrop() {
  const g = new THREE.Group();
  g.name = 'fish-drop';

  const body = mesh(GEO.fishBody, MAT.fishSilver);
  body.position.set(0, 0.10, 0);
  g.add(body);

  // Tail fin — cone pointing back
  const tail = mesh(GEO.fishTailFin, MAT.fishBlue);
  tail.position.set(-0.28, 0.10, 0);
  tail.rotation.z = -Math.PI / 2;
  g.add(tail);

  // Dorsal fin — small cone on top
  const dorsal = mesh(GEO.fishDorsal, MAT.fishBlue);
  dorsal.position.set(0.02, 0.20, 0);
  g.add(dorsal);

  // Eye dot
  const eye = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.03), MAT.eyeBlack, false);
  eye.position.set(0.18, 0.13, 0.085);
  g.add(eye);

  return g;
}
