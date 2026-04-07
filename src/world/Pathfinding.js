// ============================================================
// Pathfinding.js — A* on the Wyrdscape tile grid
// ============================================================
// 4-directional movement (no diagonals — like OSRS classic).
// All coordinates are TILE coordinates, not world units.
// Caller passes an isWalkable(x, z) callback so this module
// stays decoupled from the live world state (occupied tiles,
// monsters blocking nodes, doors that toggle, etc).
// ============================================================

import { WORLD_SIZE } from './Terrain.js';

const MAX_ITERATIONS = 5000;

// ------------------------------------------------------------
// findPath(startX, startZ, goalX, goalZ, isWalkable)
//   Returns: array of { x, z } tile steps, EXCLUDING start,
//            INCLUDING goal. Empty array if no path / same tile.
//   If goal is unwalkable, retargets to nearest walkable
//   neighbor of the goal that's actually reachable.
// ------------------------------------------------------------
export function findPath(startX, startZ, goalX, goalZ, isWalkable) {
  // Same tile — nothing to do
  if (startX === goalX && startZ === goalZ) return [];

  // Out-of-bounds start — give up
  if (!inBounds(startX, startZ)) return [];

  // If goal is blocked, find the closest walkable neighbor
  let tx = goalX, tz = goalZ;
  if (!inBounds(goalX, goalZ) || !isWalkable(goalX, goalZ)) {
    let best = null, bestD = Infinity;
    // Search 8 neighbors of the goal (include diagonals so we
    // can stand next to a tree corner-on)
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        const nx = goalX + dx, nz = goalZ + dz;
        if (!inBounds(nx, nz)) continue;
        if (!isWalkable(nx, nz)) continue;
        const d = Math.abs(nx - startX) + Math.abs(nz - startZ);
        if (d < bestD) { bestD = d; best = { x: nx, z: nz }; }
      }
    }
    if (!best) return [];
    tx = best.x; tz = best.z;
    // If the new target IS the start, no movement needed
    if (tx === startX && tz === startZ) return [];
  }

  // ----------------------------------------------------------
  // Standard A* with Manhattan heuristic
  // ----------------------------------------------------------
  const key = (x, z) => `${x},${z}`;
  const heuristic = (x, z) => Math.abs(x - tx) + Math.abs(z - tz);

  const open     = new Map(); // key → { x, z, f, g }
  const closed   = new Set();
  const cameFrom = new Map(); // key → previous key

  const startKey = key(startX, startZ);
  open.set(startKey, { x: startX, z: startZ, f: heuristic(startX, startZ), g: 0 });

  let iters = 0;
  while (open.size > 0 && iters++ < MAX_ITERATIONS) {
    // Pick the open node with the lowest f
    let currentKey = null, current = null, bestF = Infinity;
    for (const [k, node] of open) {
      if (node.f < bestF) { bestF = node.f; current = node; currentKey = k; }
    }

    // Reached the target → reconstruct path
    if (current.x === tx && current.z === tz) {
      const path = [];
      let ck = currentKey;
      while (ck !== startKey) {
        const [cx, cz] = ck.split(',').map(Number);
        path.unshift({ x: cx, z: cz });
        ck = cameFrom.get(ck);
        if (ck === undefined) break;
      }
      return path;
    }

    open.delete(currentKey);
    closed.add(currentKey);

    // 4-directional neighbors
    const neighbors = [
      [current.x + 1, current.z],
      [current.x - 1, current.z],
      [current.x,     current.z + 1],
      [current.x,     current.z - 1],
    ];

    for (const [nx, nz] of neighbors) {
      if (!inBounds(nx, nz)) continue;
      const nKey = key(nx, nz);
      if (closed.has(nKey)) continue;
      if (!isWalkable(nx, nz)) continue;

      const tentativeG = current.g + 1;
      const existing = open.get(nKey);
      if (!existing || tentativeG < existing.g) {
        cameFrom.set(nKey, currentKey);
        const f = tentativeG + heuristic(nx, nz);
        open.set(nKey, { x: nx, z: nz, f, g: tentativeG });
      }
    }
  }

  // No path found
  return [];
}

// ------------------------------------------------------------
// tileDist(x1, z1, x2, z2)
//   Manhattan distance in tiles (matches A* cost model).
// ------------------------------------------------------------
export function tileDist(x1, z1, x2, z2) {
  return Math.abs(x1 - x2) + Math.abs(z1 - z2);
}

// ------------------------------------------------------------
// isAdjacent(x1, z1, x2, z2)
//   Chebyshev distance ≤ 1 and not the same tile.
//   Used for "can attack / can interact" range checks.
// ------------------------------------------------------------
export function isAdjacent(x1, z1, x2, z2) {
  if (x1 === x2 && z1 === z2) return false;
  return Math.max(Math.abs(x1 - x2), Math.abs(z1 - z2)) <= 1;
}

// ------------------------------------------------------------
// internal: bounds check against the world grid
// ------------------------------------------------------------
function inBounds(x, z) {
  return x >= 0 && z >= 0 && x < WORLD_SIZE && z < WORLD_SIZE;
}
