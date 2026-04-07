// =============================================================
// src/graphics/effects.js
// Lightweight visual effects: damage hit splats and click markers.
// All effects are sprites/billboards drawn from procedural canvas
// textures so we never load external images.
//
// Each spawned effect registers itself in the module-local list
// and is ticked by `update(deltaTime)` from the main loop. When
// its lifetime ends it removes itself from the scene and frees
// its texture.
//
// Owned by: graphics-artist
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Active effects pool — each entry: { sprite, scene, age, life, update }
const _effects = [];

// =============================================================
// CANVAS HELPERS
// =============================================================

/**
 * Draw a hit-splat number on a 64x64 canvas and return a texture.
 * Matches OSRS convention:
 * - Damage hits: red filled circle, bold white number with black outline
 * - Zero hits:   blue filled SQUARE, bold white "0" with black outline
 */
function makeHitSplatTexture(damage, isPlayer) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const cx = size / 2;
  const cy = size / 2;

  if (damage === 0) {
    // Blue square for blocked / 0 hits (OSRS style)
    const half = 24;
    ctx.fillStyle = '#3a78c2';
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f1f3a';
    ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
  } else {
    // Red circle for damage
    const r = size / 2 - 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isPlayer ? '#c22d2d' : '#e83b3b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a0a0a';
    ctx.stroke();
  }

  // Bold white number with black outline (matches OSRS)
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#000000';
  ctx.strokeText(String(damage), cx, cy + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(String(damage), cx, cy + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Draw an X-mark on a 64x64 canvas and return a texture.
 * Used for click markers — yellow for walk, red for attack.
 */
function makeClickMarkerTexture(type) {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const color = type === 'attack' ? '#e53b3b' : '#f5d23a';

  ctx.lineCap = 'round';
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1a1a1a';

  // Outline pass (dark)
  ctx.beginPath();
  ctx.moveTo(12, 12); ctx.lineTo(52, 52);
  ctx.moveTo(52, 12); ctx.lineTo(12, 52);
  ctx.stroke();

  // Color pass (thinner)
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, 12); ctx.lineTo(52, 52);
  ctx.moveTo(52, 12); ctx.lineTo(12, 52);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// =============================================================
// PUBLIC API
// =============================================================

/**
 * Spawn a hit splat above a target. Floats up and fades out over 800ms.
 *
 * @param {THREE.Scene}   scene
 * @param {THREE.Vector3} position - World position to spawn at (typically head height)
 * @param {number}        damage   - Damage number to display (0 = blue block)
 * @param {boolean}       isPlayer - True if the splat is on the player (uses darker red)
 */
export function createHitSplat(scene, position, damage, isPlayer = false) {
  const tex = makeHitSplatTexture(damage | 0, isPlayer);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,    // always render on top
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.9, 0.9, 0.9);
  sprite.position.copy(position);
  sprite.position.y += 0.6;            // start a bit above the target
  sprite.renderOrder = 999;
  scene.add(sprite);

  _effects.push({
    sprite,
    scene,
    age: 0,
    life: 0.8,                          // seconds
    update(dt) {
      this.age += dt;
      const t = this.age / this.life;
      // Float upward
      this.sprite.position.y += dt * 0.9;
      // Fade out in the last third
      if (t > 0.6) {
        this.sprite.material.opacity = Math.max(0, 1 - (t - 0.6) / 0.4);
      }
      // Slight grow then settle
      const s = 0.9 + Math.sin(Math.min(t * Math.PI, Math.PI)) * 0.15;
      this.sprite.scale.set(s, s, s);
    },
  });
}

/**
 * Spawn a click marker on the ground at the given target tile.
 * Yellow X for walk targets, red X for attack targets.
 *
 * @param {THREE.Scene}   scene
 * @param {THREE.Vector3} position - World position (will be flattened to y ~ 0.05)
 * @param {'walk'|'attack'} type
 */
export function createClickMarker(scene, position, type = 'walk') {
  const tex = makeClickMarkerTexture(type);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.7, 0.7, 0.7);
  sprite.position.set(position.x, (position.y || 0) + 0.05, position.z);
  sprite.renderOrder = 998;
  scene.add(sprite);

  _effects.push({
    sprite,
    scene,
    age: 0,
    life: 0.6,
    update(dt) {
      this.age += dt;
      const t = this.age / this.life;
      // Quick scale-in pop
      const popScale = t < 0.15
        ? 0.4 + (t / 0.15) * 0.4    // grow from 0.4 -> 0.8
        : 0.8;
      this.sprite.scale.set(popScale, popScale, popScale);
      // Fade out over the second half
      if (t > 0.5) {
        this.sprite.material.opacity = Math.max(0, 1 - (t - 0.5) / 0.5);
      }
    },
  });
}

// =============================================================
// TILE SELECT INDICATOR (the iconic OSRS cyan square)
// =============================================================

// Persistent tile-indicator state. Only one is shown at a time —
// clicking a new destination replaces it. We track it separately
// from the _effects pool because it has no fixed lifetime; it
// persists until the caller dismisses it (or the player arrives).
let _tileIndicator = null;          // { group, scene, age, fading, fadeAge, materials }

const _cyanLineMat = new THREE.MeshBasicMaterial({
  color: 0x00ffff,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});
const _cyanCornerMat = new THREE.MeshBasicMaterial({
  color: 0x66ffff,
  transparent: true,
  depthTest: false,
  depthWrite: false,
});

/**
 * Create the iconic OSRS cyan tile-select indicator at the given world tile.
 * - Persists indefinitely (or until `dismissTileSelectIndicator()` is called).
 * - Pulses subtly so it reads as alive.
 * - Replacing it (calling again) removes the previous one immediately.
 *
 * Returns a handle with a `.dismiss()` method so the caller can fade it out
 * once the player arrives at the tile.
 *
 * @param {THREE.Scene}   scene
 * @param {THREE.Vector3} position - World position of the destination tile center
 * @param {number}        [tileSize=1] - Edge length of one world tile
 */
export function createTileSelectIndicator(scene, position, tileSize = 1) {
  // Replace any existing indicator
  if (_tileIndicator) {
    _removeTileIndicator();
  }

  const group = new THREE.Group();
  group.name = 'tile-select-indicator';
  group.renderOrder = 997;

  const half = tileSize / 2;
  const thickness = 0.06;
  const lift = 0.04;          // sit just above the ground to avoid z-fight

  // Four edge bars (BoxGeometry) forming a square outline
  const longGeo  = new THREE.BoxGeometry(tileSize, thickness, thickness);
  const shortGeo = new THREE.BoxGeometry(thickness, thickness, tileSize - thickness * 2);

  const top = new THREE.Mesh(longGeo, _cyanLineMat);
  top.position.set(0, lift,  half - thickness / 2);
  const bottom = new THREE.Mesh(longGeo, _cyanLineMat);
  bottom.position.set(0, lift, -half + thickness / 2);
  const left = new THREE.Mesh(shortGeo, _cyanLineMat);
  left.position.set(-half + thickness / 2, lift, 0);
  const right = new THREE.Mesh(shortGeo, _cyanLineMat);
  right.position.set( half - thickness / 2, lift, 0);

  // Brighter corner caps so it reads as a square in the OSRS way
  const cornerGeo = new THREE.BoxGeometry(thickness * 1.6, thickness * 1.6, thickness * 1.6);
  const c1 = new THREE.Mesh(cornerGeo, _cyanCornerMat);
  c1.position.set(-half, lift,  half);
  const c2 = new THREE.Mesh(cornerGeo, _cyanCornerMat);
  c2.position.set( half, lift,  half);
  const c3 = new THREE.Mesh(cornerGeo, _cyanCornerMat);
  c3.position.set(-half, lift, -half);
  const c4 = new THREE.Mesh(cornerGeo, _cyanCornerMat);
  c4.position.set( half, lift, -half);

  // Disable depth test so the indicator is always visible through terrain
  for (const m of [top, bottom, left, right, c1, c2, c3, c4]) {
    m.renderOrder = 997;
  }

  group.add(top, bottom, left, right, c1, c2, c3, c4);
  group.position.set(position.x, position.y || 0, position.z);
  scene.add(group);

  _tileIndicator = {
    group,
    scene,
    age: 0,
    fading: false,
    fadeAge: 0,
    fadeLife: 0.35,             // seconds for fade-out
    geometries: [longGeo, shortGeo, cornerGeo],
    update(dt) {
      this.age += dt;
      // Subtle pulse so the indicator reads as alive
      const pulse = 0.85 + Math.sin(this.age * 6) * 0.15;
      _cyanLineMat.opacity   = this.fading ? pulse * (1 - this.fadeAge / this.fadeLife) : pulse;
      _cyanCornerMat.opacity = _cyanLineMat.opacity;
      if (this.fading) {
        this.fadeAge += dt;
      }
    },
    isDone() {
      return this.fading && this.fadeAge >= this.fadeLife;
    },
  };

  return {
    /**
     * Begin the fade-out animation. The indicator will be removed once
     * the fade completes (within ~350ms).
     */
    dismiss() {
      if (_tileIndicator && _tileIndicator.group === group) {
        _tileIndicator.fading = true;
      }
    },
  };
}

/**
 * Immediately remove the active tile-select indicator (if any).
 * Useful when the player issues a new click before the previous one resolved.
 */
export function dismissTileSelectIndicator() {
  if (_tileIndicator) _tileIndicator.fading = true;
}

function _removeTileIndicator() {
  if (!_tileIndicator) return;
  if (_tileIndicator.group.parent) {
    _tileIndicator.group.parent.remove(_tileIndicator.group);
  }
  // Dispose the per-instance geometries; the shared cyan materials live
  // for the module lifetime so we do not dispose them here.
  for (const g of _tileIndicator.geometries) g.dispose();
  _tileIndicator = null;
}

// =============================================================
// FRAME UPDATE
// =============================================================

/**
 * Tick all active effects forward by deltaTime (seconds).
 * Removes any whose lifetime has elapsed and disposes their resources.
 *
 * @param {number} deltaTime - Seconds since last frame
 */
export function update(deltaTime) {
  // Persistent tile indicator
  if (_tileIndicator) {
    _tileIndicator.update(deltaTime);
    if (_tileIndicator.isDone()) {
      _removeTileIndicator();
    }
  }

  // Pooled short-lived effects
  if (_effects.length === 0) return;

  for (let i = _effects.length - 1; i >= 0; i--) {
    const e = _effects[i];
    e.update(deltaTime);
    if (e.age >= e.life) {
      // Remove from scene
      if (e.sprite.parent) e.sprite.parent.remove(e.sprite);
      // Dispose GPU resources to avoid leaks
      if (e.sprite.material.map) e.sprite.material.map.dispose();
      e.sprite.material.dispose();
      _effects.splice(i, 1);
    }
  }
}

/**
 * Drop all active effects (e.g. on scene reload). Disposes resources.
 */
export function clearAllEffects() {
  for (const e of _effects) {
    if (e.sprite.parent) e.sprite.parent.remove(e.sprite);
    if (e.sprite.material.map) e.sprite.material.map.dispose();
    e.sprite.material.dispose();
  }
  _effects.length = 0;
  _removeTileIndicator();
}
