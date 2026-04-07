// ============================================================
// Terrain.js — 3D tile-based terrain mesh for Wyrdscape
// ============================================================
// Builds a single PlaneGeometry where each vertex is colored
// according to the underlying tile type, with subtle per-vertex
// height variation for organic look. Water tiles get an
// additional transparent animated plane on top.
// ============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const WORLD_SIZE = 60;     // tiles per side
export const TILE_SIZE = 2;       // world units per tile

export const TILE_TYPES = {
  GRASS:      'GRASS',
  DIRT:       'DIRT',
  STONE:      'STONE',       // rough natural stone (goblin camp)
  PATH_STONE: 'PATH_STONE',  // smoothed paving (Grand Exchange style)
  SAND:       'SAND',
  WATER:      'WATER',
  WOOD_FLOOR: 'WOOD_FLOOR',
};

// Base colors per tile type
const TILE_COLORS = {
  GRASS:      new THREE.Color(0x3d7a2a),
  DIRT:       new THREE.Color(0x6b4a25),
  STONE:      new THREE.Color(0x7a7a78),
  PATH_STONE: new THREE.Color(0x9a9590), // lighter, cleaner gray
  SAND:       new THREE.Color(0xd9c186),
  WATER:      new THREE.Color(0x1c3a6b),
  WOOD_FLOOR: new THREE.Color(0x8a5a30),
};

// Walkable lookup (re-exported for convenience to other systems)
export const TILE_WALKABLE = {
  GRASS:      true,
  DIRT:       true,
  STONE:      true,
  PATH_STONE: true,
  SAND:       true,
  WATER:      false,
  WOOD_FLOOR: true,
};

// ------------------------------------------------------------
// Internal: tiny deterministic hash → [0,1) so terrain doesn't
// shimmer between page reloads.
// ------------------------------------------------------------
function hash01(x, z) {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// ------------------------------------------------------------
// createTerrain(world)
//   world: { tiles: TILE_TYPES[][] }  (tiles[z][x])
//   returns: THREE.Group with terrain mesh + water overlay
// ------------------------------------------------------------
export function createTerrain(world) {
  const tiles = world.tiles;
  const group = new THREE.Group();
  group.name = 'Terrain';

  const widthUnits  = WORLD_SIZE * TILE_SIZE;
  const heightUnits = WORLD_SIZE * TILE_SIZE;

  // PlaneGeometry uses (segments + 1) vertices per side. We want one
  // vertex per tile corner, so segments = WORLD_SIZE.
  const geometry = new THREE.PlaneGeometry(
    widthUnits, heightUnits,
    WORLD_SIZE, WORLD_SIZE,
  );
  // Lay it flat (XZ plane). Plane is XY by default.
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const vertexCount = positions.count;

  // Per-vertex colors
  const colors = new Float32Array(vertexCount * 3);

  // For each vertex, we average the tile colors of the (up to 4)
  // tiles that meet at that corner — this avoids harsh per-tile
  // edges and gives a soft organic blend.
  const verticesPerSide = WORLD_SIZE + 1;

  for (let vz = 0; vz < verticesPerSide; vz++) {
    for (let vx = 0; vx < verticesPerSide; vx++) {
      const idx = vz * verticesPerSide + vx;

      // Sample up to 4 surrounding tiles for color blending
      const sampleCoords = [
        [vx - 1, vz - 1],
        [vx,     vz - 1],
        [vx - 1, vz],
        [vx,     vz],
      ];

      let r = 0, g = 0, b = 0, count = 0;
      let allWater = true;
      for (const [tx, tz] of sampleCoords) {
        if (tx < 0 || tz < 0 || tx >= WORLD_SIZE || tz >= WORLD_SIZE) continue;
        const type = tiles[tz][tx];
        const c = TILE_COLORS[type] || TILE_COLORS.GRASS;
        // Slight per-tile color jitter so adjacent same-type tiles
        // don't look like a perfect grid.
        const jitter = (hash01(tx, tz) - 0.5) * 0.08;
        r += Math.min(1, Math.max(0, c.r + jitter));
        g += Math.min(1, Math.max(0, c.g + jitter));
        b += Math.min(1, Math.max(0, c.b + jitter));
        count++;
        if (type !== TILE_TYPES.WATER) allWater = false;
      }
      if (count === 0) {
        // Edge fallback (shouldn't happen with our sample box)
        r = TILE_COLORS.GRASS.r;
        g = TILE_COLORS.GRASS.g;
        b = TILE_COLORS.GRASS.b;
        count = 1;
      }
      colors[idx * 3]     = r / count;
      colors[idx * 3 + 1] = g / count;
      colors[idx * 3 + 2] = b / count;

      // Per-vertex height — water vertices stay at 0; everything
      // else gets a small bump. Pure-water corners stay flat.
      let height = 0;
      if (!allWater) {
        height = hash01(vx, vz) * 0.3;
      }
      // Position layout (after rotateX): x, y(=height), z
      positions.setY(idx, height);
    }
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.95,
    metalness: 0.0,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'TerrainMesh';
  mesh.receiveShadow = true;
  // Center the world: tile (0,0) → world ( -widthUnits/2, _, -heightUnits/2 )
  // PlaneGeometry is centered at origin, so it already spans
  // [-widthUnits/2, +widthUnits/2]. We want tile (x,z) center to be at
  // world ((x+0.5)*TILE_SIZE - widthUnits/2, _, (z+0.5)*TILE_SIZE - heightUnits/2).
  // The plane is already aligned to that grid; no offset needed.
  group.add(mesh);

  // ----------------------------------------------------------
  // Grid lines — subtle dark line at every tile border so the
  // tile grid is readable from the isometric camera angle, the
  // way OSRS shows it. Skips edges adjacent to water (since the
  // water overlay covers them anyway). Single LineSegments
  // mesh, sits 0.02u above the terrain to avoid z-fighting.
  // ----------------------------------------------------------
  {
    const gridY = 0.02;
    const linePositions = [];
    // Horizontal edges (constant z, varying x) — between rows
    for (let z = 0; z <= WORLD_SIZE; z++) {
      for (let x = 0; x < WORLD_SIZE; x++) {
        // Skip if both adjacent tiles are water
        const above = z > 0          ? tiles[z - 1][x] : null;
        const below = z < WORLD_SIZE ? tiles[z][x]     : null;
        if (above === TILE_TYPES.WATER && below === TILE_TYPES.WATER) continue;
        if (above === null && below === TILE_TYPES.WATER) continue;
        if (below === null && above === TILE_TYPES.WATER) continue;
        const wx0 = x * TILE_SIZE - widthUnits / 2;
        const wx1 = (x + 1) * TILE_SIZE - widthUnits / 2;
        const wz  = z * TILE_SIZE - heightUnits / 2;
        linePositions.push(wx0, gridY, wz, wx1, gridY, wz);
      }
    }
    // Vertical edges (constant x, varying z) — between cols
    for (let x = 0; x <= WORLD_SIZE; x++) {
      for (let z = 0; z < WORLD_SIZE; z++) {
        const left  = x > 0          ? tiles[z][x - 1] : null;
        const right = x < WORLD_SIZE ? tiles[z][x]     : null;
        if (left === TILE_TYPES.WATER && right === TILE_TYPES.WATER) continue;
        if (left === null && right === TILE_TYPES.WATER) continue;
        if (right === null && left === TILE_TYPES.WATER) continue;
        const wx  = x * TILE_SIZE - widthUnits / 2;
        const wz0 = z * TILE_SIZE - heightUnits / 2;
        const wz1 = (z + 1) * TILE_SIZE - heightUnits / 2;
        linePositions.push(wx, gridY, wz0, wx, gridY, wz1);
      }
    }
    const gridGeom = new THREE.BufferGeometry();
    gridGeom.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(linePositions), 3));
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,    // subtle — readable but not garish
      depthWrite: false,
    });
    const gridLines = new THREE.LineSegments(gridGeom, gridMat);
    gridLines.name = 'TerrainGrid';
    group.add(gridLines);
  }

  // ----------------------------------------------------------
  // Water overlay — one transparent plane covering all WATER
  // tiles, with a vertex shader-friendly wave animation done
  // in update() by mutating vertex Y positions.
  // ----------------------------------------------------------
  const waterTilePositions = [];
  for (let z = 0; z < WORLD_SIZE; z++) {
    for (let x = 0; x < WORLD_SIZE; x++) {
      if (tiles[z][x] === TILE_TYPES.WATER) {
        waterTilePositions.push({ x, z });
      }
    }
  }

  let waterMesh = null;
  if (waterTilePositions.length > 0) {
    // Build a single merged geometry containing one quad per water tile.
    // Each quad has 4 verts and 2 tris (6 indices).
    const tileCount = waterTilePositions.length;
    const wPositions = new Float32Array(tileCount * 4 * 3);
    const wIndices  = new Uint32Array(tileCount * 6);
    const wOriginalY = new Float32Array(tileCount * 4); // for animation
    const wPhase     = new Float32Array(tileCount * 4); // per-vertex phase

    const half = TILE_SIZE / 2;
    for (let i = 0; i < tileCount; i++) {
      const { x, z } = waterTilePositions[i];
      // Tile center in world coordinates
      const cx = (x + 0.5) * TILE_SIZE - widthUnits / 2;
      const cz = (z + 0.5) * TILE_SIZE - heightUnits / 2;
      const y = 0.05; // sits just above terrain

      // 4 corners (CCW when viewed from above)
      const v = [
        [cx - half, y, cz - half],
        [cx + half, y, cz - half],
        [cx + half, y, cz + half],
        [cx - half, y, cz + half],
      ];
      for (let k = 0; k < 4; k++) {
        const base = (i * 4 + k) * 3;
        wPositions[base]     = v[k][0];
        wPositions[base + 1] = v[k][1];
        wPositions[base + 2] = v[k][2];
        wOriginalY[i * 4 + k] = y;
        wPhase[i * 4 + k]     = (v[k][0] + v[k][2]) * 0.6;
      }
      const baseIdx = i * 4;
      const idxBase = i * 6;
      wIndices[idxBase]     = baseIdx;
      wIndices[idxBase + 1] = baseIdx + 1;
      wIndices[idxBase + 2] = baseIdx + 2;
      wIndices[idxBase + 3] = baseIdx;
      wIndices[idxBase + 4] = baseIdx + 2;
      wIndices[idxBase + 5] = baseIdx + 3;
    }

    const waterGeom = new THREE.BufferGeometry();
    waterGeom.setAttribute('position', new THREE.BufferAttribute(wPositions, 3));
    waterGeom.setIndex(new THREE.BufferAttribute(wIndices, 1));
    waterGeom.computeVertexNormals();

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x2a5a9c,
      transparent: true,
      opacity: 0.78,
      roughness: 0.25,
      metalness: 0.15,
      side: THREE.DoubleSide,
    });

    waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.name = 'WaterOverlay';
    waterMesh.receiveShadow = true;
    waterMesh.userData.originalY = wOriginalY;
    waterMesh.userData.phase = wPhase;
    group.add(waterMesh);
  }

  // ----------------------------------------------------------
  // update(dt) — wave animation for water overlay
  // ----------------------------------------------------------
  let elapsed = 0;
  group.update = function update(dt) {
    if (!waterMesh) return;
    elapsed += dt;
    const pos = waterMesh.geometry.attributes.position;
    const orig = waterMesh.userData.originalY;
    const phase = waterMesh.userData.phase;
    const count = pos.count;
    for (let i = 0; i < count; i++) {
      const wave = Math.sin(elapsed * 1.6 + phase[i]) * 0.05
                 + Math.cos(elapsed * 0.9 + phase[i] * 1.3) * 0.03;
      pos.setY(i, orig[i] + wave);
    }
    pos.needsUpdate = true;
  };

  return group;
}
