// =============================================================
// src/ui/HitSplat.js
// Floating damage / miss / heal indicator above a 3D world point.
//
//   createHitSplat(worldPos, damage, type, camera, opts?) -> element
//
//   worldPos: THREE.Vector3 (world-space)
//   damage:   number (or string for non-numeric splats)
//   type:     'damage' | 'miss' | 'heal'
//   camera:   THREE.Camera (perspective or orthographic)
//   opts:     { renderer?, container?, lifetimeMs? }
//
// Animation runs purely via CSS keyframes; we self-remove after
// lifetime so callers don't have to track the element.
//
// Owned by: ui-builder
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const _v = new THREE.Vector3();
const DEFAULT_LIFETIME = 800;

function getOverlayContainer() {
  return document.getElementById('ui-overlay') || document.body;
}

export function createHitSplat(worldPos, damage, type = 'damage', camera, opts = {}) {
  if (!camera) {
    console.warn('[HitSplat] camera required');
    return null;
  }
  const container = opts.container || getOverlayContainer();
  const renderer  = opts.renderer  || (window.GameState && window.GameState.renderer);
  const lifetime  = opts.lifetimeMs || DEFAULT_LIFETIME;

  // Project world position to NDC
  _v.copy(worldPos);
  _v.project(camera);

  // Behind camera? Skip drawing.
  if (_v.z > 1) return null;

  // Convert NDC -> screen pixels
  let w = window.innerWidth;
  let h = window.innerHeight;
  if (renderer && renderer.domElement) {
    const r = renderer.domElement.getBoundingClientRect();
    w = r.width;
    h = r.height;
    var offX = r.left;
    var offY = r.top;
  } else {
    var offX = 0;
    var offY = 0;
  }
  const sx = (_v.x * 0.5 + 0.5) * w + offX;
  const sy = (-_v.y * 0.5 + 0.5) * h + offY;

  const el = document.createElement('div');
  el.className = 'ws-hitsplat ' + type;
  el.style.left = sx + 'px';
  el.style.top  = sy + 'px';

  if (type === 'miss') {
    el.textContent = '0';
  } else {
    el.textContent = String(damage);
  }
  // Ensure it doesn't intercept clicks
  el.style.pointerEvents = 'none';

  container.appendChild(el);

  // CSS animation handles motion + fade. Remove on completion.
  const removeAt = setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, lifetime + 50);
  el.addEventListener('animationend', () => {
    clearTimeout(removeAt);
    if (el.parentNode) el.parentNode.removeChild(el);
  });

  return el;
}

// Convenience: spawn a click-to-move marker at a world tile.
// Used by gameplay layer to show the cyan square. Caller passes the
// player's destination world position; we project to screen.
export function createClickMarker(worldPos, camera, opts = {}) {
  if (!camera) return null;
  const container = opts.container || getOverlayContainer();
  const renderer  = opts.renderer  || (window.GameState && window.GameState.renderer);

  _v.copy(worldPos);
  _v.project(camera);
  if (_v.z > 1) return null;

  let w = window.innerWidth;
  let h = window.innerHeight;
  let offX = 0;
  let offY = 0;
  if (renderer && renderer.domElement) {
    const r = renderer.domElement.getBoundingClientRect();
    w = r.width; h = r.height; offX = r.left; offY = r.top;
  }
  const sx = (_v.x * 0.5 + 0.5) * w + offX;
  const sy = (-_v.y * 0.5 + 0.5) * h + offY;

  const el = document.createElement('div');
  el.className = 'ws-click-marker';
  el.style.left = sx + 'px';
  el.style.top  = sy + 'px';
  container.appendChild(el);

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 650);
  return el;
}
