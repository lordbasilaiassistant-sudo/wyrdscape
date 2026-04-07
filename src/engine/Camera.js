// =============================================================
// src/engine/Camera.js
// Orbital follow camera for the player avatar.
//
// Stores azimuth (yaw), elevation (pitch), distance (zoom), and
// updates the underlying THREE.PerspectiveCamera each frame so it
// orbits a target Object3D with smooth lerp.
//
// Owned by: engine-lead
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const TAU = Math.PI * 2;
const MIN_ELEVATION = 0.2;
const MAX_ELEVATION = Math.PI / 2.2;
const MIN_DISTANCE  = 8;
const MAX_DISTANCE  = 35;

/**
 * Create an orbital camera controller bound to an underlying
 * THREE.PerspectiveCamera and a target Object3D.
 *
 * @param {THREE.PerspectiveCamera} threeCamera
 * @param {THREE.Object3D} target
 * @returns {{
 *   azimuth: number,
 *   elevation: number,
 *   distance: number,
 *   threeCamera: THREE.PerspectiveCamera,
 *   target: THREE.Object3D,
 *   setTarget(t: THREE.Object3D): void,
 *   rotate(dAz: number): void,
 *   pitch(dEl: number): void,
 *   zoom(dZ: number): void,
 *   update(dt: number): void,
 *   getForward(): THREE.Vector3
 * }}
 */
export function createCamera(threeCamera, target) {
  const state = {
    azimuth:   Math.PI / 4,
    elevation: Math.PI / 3.5,
    distance:  18,
    threeCamera,
    target,

    // smoothed values used for actual placement
    _smoothAz:   Math.PI / 4,
    _smoothEl:   Math.PI / 3.5,
    _smoothDist: 18,
    _focus: new THREE.Vector3(),
    _smoothFocus: new THREE.Vector3(),
  };

  state.setTarget = (t) => { state.target = t; };

  // Alias: `yaw` is the HUD-facing name for `azimuth`. Reading or
  // writing it goes straight to the orbit azimuth. The compass
  // widget in HUD.js reads gameState.camera.yaw each frame.
  Object.defineProperty(state, 'yaw', {
    get() { return state.azimuth; },
    set(v) { state.azimuth = v; },
  });

  state.resetNorth = () => {
    state.azimuth = 0;
  };

  state.rotate = (dAz) => {
    state.azimuth = (state.azimuth + dAz) % TAU;
    if (state.azimuth < 0) state.azimuth += TAU;
  };

  state.pitch = (dEl) => {
    state.elevation = clamp(state.elevation + dEl, MIN_ELEVATION, MAX_ELEVATION);
  };

  state.zoom = (dZ) => {
    state.distance = clamp(state.distance + dZ, MIN_DISTANCE, MAX_DISTANCE);
  };

  state.getForward = () => {
    // World-space forward vector projected onto XZ plane (good for
    // movement input that should be camera-relative).
    const fwd = new THREE.Vector3();
    threeCamera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    return fwd;
  };

  /**
   * Position the underlying THREE camera around its target.
   * Smoothly lerps to the requested azimuth/elevation/distance so
   * fast input feels weighty rather than snappy.
   */
  state.update = (dt) => {
    if (!state.target) return;

    // Lerp orbit values toward inputs.
    const k = 1 - Math.exp(-12 * dt); // frame-rate independent smoothing
    state._smoothAz   = lerpAngle(state._smoothAz,   state.azimuth,   k);
    state._smoothEl   = lerp(state._smoothEl,   state.elevation, k);
    state._smoothDist = lerp(state._smoothDist, state.distance,  k);

    // Focus on a point slightly above the target's feet.
    state._focus.copy(state.target.position).add(_FOCUS_OFFSET);
    state._smoothFocus.lerp(state._focus, k);

    const r = state._smoothDist;
    const cosE = Math.cos(state._smoothEl);
    const sinE = Math.sin(state._smoothEl);
    const cosA = Math.cos(state._smoothAz);
    const sinA = Math.sin(state._smoothAz);

    threeCamera.position.set(
      state._smoothFocus.x + r * cosE * sinA,
      state._smoothFocus.y + r * sinE,
      state._smoothFocus.z + r * cosE * cosA
    );
    threeCamera.lookAt(state._smoothFocus);
  };

  return state;
}

const _FOCUS_OFFSET = new THREE.Vector3(0, 1.4, 0);

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Lerp around a circle so we always take the short way around.
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff >  Math.PI) diff -= TAU;
  while (diff < -Math.PI) diff += TAU;
  return a + diff * t;
}
