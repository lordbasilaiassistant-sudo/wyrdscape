// =============================================================
// src/engine/Input.js
// Keyboard + mouse input for the orbital camera and click handlers.
//
// - Arrow Left/Right rotate the camera (per frame held)
// - Arrow Up/Down tilt
// - + / - zoom in/out
// - Left-click fires onLeftClick callback
// - Right-click fires onRightClick callback (preventDefault)
// - screenToWorld(event, scene) raycasts using the THREE camera
//
// Owned by: engine-lead
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const ROTATE_SPEED = 1.8;  // radians per second held
const PITCH_SPEED  = 1.1;
const ZOOM_SPEED   = 18;   // units per second held

/**
 * Create the input system.
 *
 * @param {HTMLCanvasElement} canvas - The renderer DOM element.
 * @param {ReturnType<import('./Camera.js').createCamera>} camera
 * @returns {{
 *   update(dt: number): void,
 *   setLeftClickHandler(fn: (event: MouseEvent) => void): void,
 *   setRightClickHandler(fn: (event: MouseEvent) => void): void,
 *   screenToWorld(event: MouseEvent, scene: THREE.Scene): Array<{point: THREE.Vector3, object: THREE.Object3D}>,
 *   raycastObjects(event: MouseEvent, objects: THREE.Object3D[]): Array<{point: THREE.Vector3, object: THREE.Object3D}>,
 *   keys: Record<string, boolean>,
 *   dispose(): void
 * }}
 */
export function createInput(canvas, camera) {
  const keys = Object.create(null);
  let onLeft  = null;
  let onRight = null;

  // Mouse state for distinguishing click vs drag.
  let downX = 0, downY = 0, downBtn = -1;
  const CLICK_TOLERANCE = 5; // px

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();

  // ---- Keyboard ----------------------------------------------
  const onKeyDown = (e) => {
    keys[e.code] = true;
    // Allow text input fields (if any) to keep working.
    if (isHandledKey(e.code)) e.preventDefault();
  };
  const onKeyUp = (e) => { keys[e.code] = false; };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup',   onKeyUp);

  // ---- Mouse -------------------------------------------------
  const onMouseDown = (e) => {
    downX = e.clientX;
    downY = e.clientY;
    downBtn = e.button;
  };

  const onMouseUp = (e) => {
    if (e.button !== downBtn) return;
    const dx = e.clientX - downX;
    const dy = e.clientY - downY;
    const moved = (dx*dx + dy*dy) > (CLICK_TOLERANCE * CLICK_TOLERANCE);
    if (moved) { downBtn = -1; return; }

    if (e.button === 0 && onLeft)  onLeft(e);
    if (e.button === 2 && onRight) onRight(e);
    downBtn = -1;
  };

  const onContextMenu = (e) => { e.preventDefault(); };

  canvas.addEventListener('mousedown',   onMouseDown);
  canvas.addEventListener('mouseup',     onMouseUp);
  canvas.addEventListener('contextmenu', onContextMenu);

  // ---- Raycast helpers ---------------------------------------
  function setNDC(event) {
    const rect = canvas.getBoundingClientRect();
    ndc.x = ((event.clientX - rect.left) / rect.width)  *  2 - 1;
    ndc.y = ((event.clientY - rect.top)  / rect.height) * -2 + 1;
  }

  function screenToWorld(event, scene) {
    setNDC(event);
    raycaster.setFromCamera(ndc, camera.threeCamera);
    return raycaster.intersectObjects(scene.children, true);
  }

  function raycastObjects(event, objects) {
    setNDC(event);
    raycaster.setFromCamera(ndc, camera.threeCamera);
    return raycaster.intersectObjects(objects, true);
  }

  // ---- Per-frame update --------------------------------------
  function update(dt) {
    if (keys.ArrowLeft)  camera.rotate(-ROTATE_SPEED * dt);
    if (keys.ArrowRight) camera.rotate( ROTATE_SPEED * dt);
    if (keys.ArrowUp)    camera.pitch( PITCH_SPEED * dt);
    if (keys.ArrowDown)  camera.pitch(-PITCH_SPEED * dt);

    // + key (Equal with shift), NumpadAdd, or just Equal (=) without shift
    if (keys.Equal || keys.NumpadAdd)      camera.zoom(-ZOOM_SPEED * dt);
    if (keys.Minus || keys.NumpadSubtract) camera.zoom( ZOOM_SPEED * dt);
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup',   onKeyUp);
    canvas.removeEventListener('mousedown',   onMouseDown);
    canvas.removeEventListener('mouseup',     onMouseUp);
    canvas.removeEventListener('contextmenu', onContextMenu);
  }

  return {
    keys,
    update,
    setLeftClickHandler:  (fn) => { onLeft  = fn; },
    setRightClickHandler: (fn) => { onRight = fn; },
    screenToWorld,
    raycastObjects,
    dispose,
  };
}

function isHandledKey(code) {
  switch (code) {
    case 'ArrowLeft': case 'ArrowRight':
    case 'ArrowUp':   case 'ArrowDown':
    case 'Equal':     case 'Minus':
    case 'NumpadAdd': case 'NumpadSubtract':
      return true;
    default:
      return false;
  }
}
