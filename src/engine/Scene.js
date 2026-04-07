// =============================================================
// src/engine/Scene.js
// Builds the Three.js scene, renderer, camera, and lighting rig.
//
// Owned by: engine-lead
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/**
 * Create the core Three.js scene + renderer + perspective camera.
 *
 * @param {HTMLElement} mount - The DOM element to mount the canvas in.
 * @returns {{
 *   scene: THREE.Scene,
 *   renderer: THREE.WebGLRenderer,
 *   camera: THREE.PerspectiveCamera,
 *   dirLight: THREE.DirectionalLight,
 *   ambLight: THREE.HemisphereLight
 * }}
 */
export function createScene(mount) {
  const width  = window.innerWidth;
  const height = window.innerHeight;

  // ---- Scene -------------------------------------------------
  const scene = new THREE.Scene();
  // Sky-blue background that matches the fog colour for a soft horizon.
  const skyColor = new THREE.Color(0x9cc6ff);
  scene.background = skyColor;
  scene.fog = new THREE.Fog(skyColor, 50, 220);

  // ---- Renderer ----------------------------------------------
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;

  if (mount) {
    // Replace any existing canvas if we are remounted (HMR safety).
    while (mount.firstChild) mount.removeChild(mount.firstChild);
    mount.appendChild(renderer.domElement);
  }

  // ---- Camera (perspective) ----------------------------------
  const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);
  camera.position.set(20, 22, 20);
  camera.lookAt(0, 0, 0);

  // ---- Lights ------------------------------------------------
  // Soft hemisphere fill — sky color above, warm ground below.
  // Boosted from 0.85 → 1.4 because building interiors and shadowed
  // areas were rendering nearly black on the live build.
  const ambLight = new THREE.HemisphereLight(0xc8dcff, 0x6a5028, 1.4);
  scene.add(ambLight);

  // Key directional light — warm sun, soft shadows.
  const dirLight = new THREE.DirectionalLight(0xfff1c8, 1.35);
  dirLight.position.set(40, 60, 30);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far  = 220;
  dirLight.shadow.camera.left   = -90;
  dirLight.shadow.camera.right  =  90;
  dirLight.shadow.camera.top    =  90;
  dirLight.shadow.camera.bottom = -90;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;
  scene.add(dirLight);
  scene.add(dirLight.target);

  // ---- Resize handler ----------------------------------------
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  return { scene, renderer, camera, dirLight, ambLight };
}
