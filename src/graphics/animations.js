// =============================================================
// src/graphics/animations.js
// Procedural per-frame character animations driven on top of the
// THREE.Group hierarchies built in models.js. No animation library —
// pure rotation/translation on named sub-meshes.
//
// Public API:
//   createAnimator(mesh) -> {
//     state, setState(name), update(dt, elapsed)
//   }
//
// state: 'idle' | 'walk' | 'attack'
//   - idle:   subtle Y-scale "breathing"
//   - walk:   counter-rotating legs + opposing arms + vertical bob
//   - attack: one-shot right-arm overhead swing, auto-returns to idle
//
// The animator tolerates missing sub-meshes — a cow has no arms or
// hair, a chicken has no head pivot, etc. Each frame it only animates
// what it actually found at construction time.
//
// Owned by: animation-engineer
// =============================================================

// ---- Tunables ------------------------------------------------
const WALK_FREQ_HZ        = 2.0;     // leg/arm cycle frequency
const WALK_LEG_AMP        = 0.5;     // radians, leg swing amplitude
const WALK_ARM_AMP        = 0.4;     // radians, arm swing amplitude
const WALK_BOB_AMP        = 0.05;    // world units, vertical bob
const COW_WALK_FREQ_HZ    = 1.4;     // cow legs are slower
const COW_WALK_LEG_AMP    = 0.35;
const COW_BODY_SWAY_AMP   = 0.06;    // radians, side-to-side body sway
const GOBLIN_WALK_FREQ_HZ = 2.4;     // bouncier than player
const GOBLIN_BOB_AMP      = 0.09;
const IDLE_BREATH_FREQ_HZ = 0.5;
const IDLE_BREATH_AMP     = 0.02;    // ±2% Y scale
const ATTACK_DURATION_S   = 0.40;    // 400ms swing
const RETURN_DURATION_S   = 0.20;    // 200ms lerp back to neutral
const TWO_PI              = Math.PI * 2;

// Named limbs the animator looks for. Missing entries are fine.
// Walk animation considers any matching name; absent ones are skipped.
const HUMANOID_LIMBS = [
  'leftArm', 'rightArm', 'leftLeg', 'rightLeg',
];
const COW_LEGS = [
  'frontLeftLeg', 'frontRightLeg', 'backLeftLeg', 'backRightLeg',
];

// ---- Helpers -------------------------------------------------

function findChildByName(group, name) {
  if (!group || !group.children) return null;
  for (const c of group.children) {
    if (c.name === name) return c;
  }
  return null;
}

// Detect what kind of model we're animating from group.name. The
// graphics-artist sets g.name = 'player' | 'goblin' | 'cow' | 'chicken'
// in models.js. Anything unknown falls through to humanoid defaults.
function classify(mesh) {
  const n = (mesh?.name || '').toLowerCase();
  if (n === 'cow')     return 'cow';
  if (n === 'chicken') return 'chicken';
  if (n === 'goblin')  return 'goblin';
  return 'humanoid'; // player, npcs
}

// Snapshot the rest pose so we can lerp back to it on state changes.
function snapshotRest(node) {
  if (!node) return null;
  return {
    rx: node.rotation.x,
    ry: node.rotation.y,
    rz: node.rotation.z,
    px: node.position.x,
    py: node.position.y,
    pz: node.position.z,
    sy: node.scale.y,
  };
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Smoothly approach a target value with an exponential decay. dt-stable.
function damp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

// =============================================================
// Animator
// =============================================================

/**
 * Create a procedural animator for an entity mesh group.
 *
 * @param {THREE.Group} mesh - the entity's THREE.Group as built by models.js.
 *                             Sub-meshes are looked up by .name.
 * @returns {{state: string, setState: (name: string) => void, update: (dt: number, elapsed: number) => void}}
 */
export function createAnimator(mesh) {
  if (!mesh) {
    return { state: 'idle', setState() {}, update() {} };
  }

  const kind = classify(mesh);

  // Resolve named children once at construction. If the model author
  // hasn't named a part, we just get null — the per-frame loop checks.
  const parts = {
    head:     findChildByName(mesh, 'head'),
    body:     findChildByName(mesh, 'body'),
    leftArm:  findChildByName(mesh, 'leftArm'),
    rightArm: findChildByName(mesh, 'rightArm'),
    leftLeg:  findChildByName(mesh, 'leftLeg'),
    rightLeg: findChildByName(mesh, 'rightLeg'),
    sword:    findChildByName(mesh, 'sword'),
    // Cow-specific
    frontLeftLeg:  findChildByName(mesh, 'frontLeftLeg'),
    frontRightLeg: findChildByName(mesh, 'frontRightLeg'),
    backLeftLeg:   findChildByName(mesh, 'backLeftLeg'),
    backRightLeg:  findChildByName(mesh, 'backRightLeg'),
  };

  // Sword may have been parented under rightArm in the player model.
  // Search recursively if it wasn't a direct child.
  if (!parts.sword) {
    mesh.traverse((c) => {
      if (!parts.sword && c.name === 'sword') parts.sword = c;
    });
  }

  // Snapshot rest poses so animations are relative and revertible.
  const rest = {};
  for (const [k, v] of Object.entries(parts)) rest[k] = snapshotRest(v);
  // Whole-mesh rest (for vertical bob during walk and breathing).
  const meshRestY     = mesh.position.y;
  const meshRestScale = mesh.scale.y;

  // Per-instance phase offset so a herd of cows isn't lockstep.
  const phaseOffset = Math.random() * TWO_PI;

  // Internal state machine
  let state = 'idle';
  let prevState = 'idle';
  // Time since last state transition (seconds). Used for smooth lerps.
  let stateTime = 0;
  // Attack one-shot timer (seconds elapsed since attack started)
  let attackT = 0;

  function setState(name) {
    if (name === state) return;
    // Don't interrupt an in-progress attack with idle/walk — wait for
    // the swing to finish, then we'll auto-return.
    if (state === 'attack' && name !== 'attack' && attackT < ATTACK_DURATION_S) {
      // Defer: remember the desired post-attack state
      pendingState = name;
      return;
    }
    prevState = state;
    state = name;
    stateTime = 0;
    if (name === 'attack') attackT = 0;
  }

  let pendingState = null;

  // Reset a part toward its rest pose with exponential damping.
  function dampToRest(node, restPose, dt) {
    if (!node || !restPose) return;
    const lambda = 18; // ~200ms half-life
    node.rotation.x = damp(node.rotation.x, restPose.rx, lambda, dt);
    node.rotation.z = damp(node.rotation.z, restPose.rz, lambda, dt);
  }

  // Force a part instantly back to rest (used at frame start before
  // applying a fresh procedural pose so we don't compound deltas).
  function snapToRest(node, restPose) {
    if (!node || !restPose) return;
    node.rotation.x = restPose.rx;
    node.rotation.z = restPose.rz;
  }

  // ---- Per-frame update --------------------------------------
  function update(dt, elapsed) {
    if (!dt || dt <= 0) return;
    stateTime += dt;

    // Auto-finish attack one-shot
    if (state === 'attack') {
      attackT += dt;
      if (attackT >= ATTACK_DURATION_S) {
        // Drop back to whatever was queued, or idle by default
        const next = pendingState || 'idle';
        pendingState = null;
        prevState = state;
        state = next;
        stateTime = 0;
        attackT = 0;
      }
    }

    // Reset whole-mesh transforms before re-applying state-driven ones.
    // (Per-limb resets happen inside applyWalk/applyIdle so they can
    // smoothly damp during transitions.)
    mesh.position.y = meshRestY;
    mesh.scale.y    = meshRestScale;

    if (state === 'walk') {
      applyWalk(elapsed, dt);
    } else if (state === 'attack') {
      applyAttack(dt);
    } else {
      applyIdle(elapsed, dt);
    }
  }

  // ---- Walk cycle --------------------------------------------
  function applyWalk(elapsed, dt) {
    // Pick model-specific tuning
    let freq, legAmp, armAmp, bobAmp;
    if (kind === 'cow') {
      freq = COW_WALK_FREQ_HZ;
      legAmp = COW_WALK_LEG_AMP;
      armAmp = 0;
      bobAmp = WALK_BOB_AMP * 0.5;
    } else if (kind === 'goblin') {
      freq = GOBLIN_WALK_FREQ_HZ;
      legAmp = WALK_LEG_AMP;
      armAmp = WALK_ARM_AMP;
      bobAmp = GOBLIN_BOB_AMP;
    } else {
      freq = WALK_FREQ_HZ;
      legAmp = WALK_LEG_AMP;
      armAmp = WALK_ARM_AMP;
      bobAmp = WALK_BOB_AMP;
    }

    const phase = elapsed * freq * TWO_PI + phaseOffset;
    const swing = Math.sin(phase);

    // Bipeds: counter-rotate legs and opposing arms.
    if (kind !== 'cow' && kind !== 'chicken') {
      animateLimb(parts.leftLeg,  rest.leftLeg,  +swing * legAmp);
      animateLimb(parts.rightLeg, rest.rightLeg, -swing * legAmp);
      // Arms swing OPPOSITE to legs (left arm with right leg)
      animateLimb(parts.leftArm,  rest.leftArm,  -swing * armAmp);
      animateLimb(parts.rightArm, rest.rightArm, +swing * armAmp);
    }

    // Quadrupeds: cow's diagonal pairs move together (front-left with
    // back-right, etc), like a real walking animal.
    if (kind === 'cow') {
      animateLimb(parts.frontLeftLeg,  rest.frontLeftLeg,  +swing * legAmp);
      animateLimb(parts.backRightLeg,  rest.backRightLeg,  +swing * legAmp);
      animateLimb(parts.frontRightLeg, rest.frontRightLeg, -swing * legAmp);
      animateLimb(parts.backLeftLeg,   rest.backLeftLeg,   -swing * legAmp);
      // Body sways slightly side to side as it walks
      mesh.rotation.z = Math.sin(phase * 0.5) * COW_BODY_SWAY_AMP;
    } else {
      // Make sure non-cows don't accumulate body sway from a previous
      // animation. (This is safe — cow's group origin is unrotated.)
      // We don't snap mesh.rotation.z because main.js may have set
      // mesh.rotation.y for facing; only Z is ours to drive.
      // (Z is unused on bipeds, so leaving it alone is fine.)
    }

    // Chicken just bobs slightly with the rest pose intact.
    if (kind === 'chicken') {
      // Tiny leg twitch using direct rotation (chicken legs aren't pivots)
      // so we skip limb animation and only apply the bob.
    }

    // Vertical bob (use abs(sin) so it never goes below ground)
    mesh.position.y = meshRestY + Math.abs(Math.sin(phase)) * bobAmp;
  }

  // Set a limb's X-axis rotation relative to its rest pose, applied
  // each frame. Pivot groups built in models.js rotate around the joint.
  function animateLimb(node, restPose, deltaX) {
    if (!node || !restPose) return;
    node.rotation.x = restPose.rx + deltaX;
  }

  // ---- Attack swing ------------------------------------------
  // Right-arm overhead chop: rotation Z eased from 0 → -1.5 → 0 over
  // ATTACK_DURATION_S. The sword (if parented under the arm) follows
  // automatically. Other limbs damp toward rest so the body doesn't
  // freeze mid-stride.
  function applyAttack(dt) {
    const arm = parts.rightArm;
    const armRest = rest.rightArm;
    if (arm && armRest) {
      const t = Math.min(1, attackT / ATTACK_DURATION_S);
      // Triangle wave: 0 → 1 → 0 across the duration. Smoothstepped
      // for a more natural windup/follow-through.
      const tri = t < 0.5 ? (t * 2) : (2 - t * 2);
      const eased = tri * tri * (3 - 2 * tri); // smoothstep
      const swingZ = -1.5 * eased;
      arm.rotation.z = armRest.rz + swingZ;
      // Add a little forward pitch on X for a chop feel
      arm.rotation.x = armRest.rx + (-0.6 * eased);
    }

    // Damp the rest of the body to its rest pose so we don't keep
    // a frozen walk frame underneath the swing.
    dampToRest(parts.leftArm,  rest.leftArm,  dt);
    dampToRest(parts.leftLeg,  rest.leftLeg,  dt);
    dampToRest(parts.rightLeg, rest.rightLeg, dt);
    if (kind === 'cow') {
      dampToRest(parts.frontLeftLeg,  rest.frontLeftLeg,  dt);
      dampToRest(parts.frontRightLeg, rest.frontRightLeg, dt);
      dampToRest(parts.backLeftLeg,   rest.backLeftLeg,   dt);
      dampToRest(parts.backRightLeg,  rest.backRightLeg,  dt);
    }
  }

  // ---- Idle --------------------------------------------------
  function applyIdle(elapsed, dt) {
    // Smoothly return all limbs toward rest. After ~200ms the
    // damping will have all but converged.
    dampToRest(parts.leftArm,  rest.leftArm,  dt);
    dampToRest(parts.rightArm, rest.rightArm, dt);
    dampToRest(parts.leftLeg,  rest.leftLeg,  dt);
    dampToRest(parts.rightLeg, rest.rightLeg, dt);
    if (kind === 'cow') {
      dampToRest(parts.frontLeftLeg,  rest.frontLeftLeg,  dt);
      dampToRest(parts.frontRightLeg, rest.frontRightLeg, dt);
      dampToRest(parts.backLeftLeg,   rest.backLeftLeg,   dt);
      dampToRest(parts.backRightLeg,  rest.backRightLeg,  dt);
      mesh.rotation.z = damp(mesh.rotation.z, 0, 8, dt);
    }

    // Gentle breathing: scale.y oscillates ±IDLE_BREATH_AMP.
    const phase = elapsed * IDLE_BREATH_FREQ_HZ * TWO_PI + phaseOffset;
    const breath = 1 + Math.sin(phase) * IDLE_BREATH_AMP;
    mesh.scale.y = meshRestScale * breath;
  }

  // Public API ------------------------------------------------
  const api = {
    get state() { return state; },
    setState,
    update,
  };
  return api;
}
