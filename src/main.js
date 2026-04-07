// =============================================================
// src/main.js
// Wyrdscape entry point — full integration.
//
// Wires together:
//   engine/   — Scene, Camera, Input
//   world/    — Terrain, Areas, Pathfinding
//   systems/  — Combat, Skills, Inventory, Save, PlayerState
//   graphics/ — materials, models, effects
//   data/     — items, monsters, npcs, quests, lore
//   ui/       — HUD, Inventory, Stats, Chat, ContextMenu, HitSplat
//
// Owned by: engine-lead
// =============================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// ---- engine ---------------------------------------------------
import { createScene }  from './engine/Scene.js';
import { createCamera } from './engine/Camera.js';
import { createInput }  from './engine/Input.js';

// ---- world ----------------------------------------------------
import {
  createTerrain,
  WORLD_SIZE, TILE_SIZE, TILE_TYPES, TILE_WALKABLE,
} from './world/Terrain.js';
import { defineWorld } from './world/Areas.js';
import { findPath, tileDist, isAdjacent } from './world/Pathfinding.js';

// ---- systems --------------------------------------------------
import { tryAttack } from './systems/Combat.js';
import {
  defaultSkills, gainXp, combatLevel, levelForXp, xpForLevel,
} from './systems/Skills.js';
import {
  defaultInventory, addItem, removeItem, MAX_SLOTS,
} from './systems/Inventory.js';
import { saveGame, loadGame, clearSave } from './systems/Save.js';
import { defaultPlayerState } from './systems/PlayerState.js';

// ---- graphics -------------------------------------------------
import { MATERIALS as MAT } from './graphics/materials.js';
import {
  createPlayerModel, createGoblinModel, createCowModel, createChickenModel,
  createTreeModel, createOakTreeModel, createTreeStumpModel,
  createBuildingModel, createFenceModel,
  createLogDrop, createCoinDrop, createMeatDrop, createBoneDrop,
} from './graphics/models.js';
import * as Effects from './graphics/effects.js';

// ---- data -----------------------------------------------------
import ITEMS from './data/items.js';
import MONSTERS, { rollDrops } from './data/monsters.js';
import NPCS from './data/npcs.js';
import QUESTS, { instantiateQuest } from './data/quests.js';

// ---- ui -------------------------------------------------------
import { createHUD } from './ui/HUD.js';
import { createHitSplat as uiCreateHitSplat } from './ui/HitSplat.js';

// =============================================================
// CONSTANTS
// =============================================================

const WORLD_UNITS    = WORLD_SIZE * TILE_SIZE;         // 120 total
const HALF_WORLD     = WORLD_UNITS / 2;                // 60
const LOGIC_TICK_MS  = 600;                            // OSRS-style fixed sim tick
const LOGIC_TICK_SEC = LOGIC_TICK_MS / 1000;
const ATTACK_TICKS   = 4;                              // 4 ticks between swings
const CHOP_TICKS     = 2;                              // 2 ticks between chop attempts
const SAVE_TICKS     = 17;                             // ~10s autosave

// Starter inventory uses these item ids (matches data/items.js)
const STARTER_INVENTORY = [
  { id: 'bronze_cutlass',  qty: 1 },
  { id: 'bronze_handaxe',  qty: 1 },
  { id: 'cooked_beef',     qty: 3 },
];

// Color palette for inventory slots (first-letter placeholder)
const ITEM_COLORS = {
  logs:            '#8a5a2b',
  oak_logs:        '#6b4423',
  willow_logs:     '#a8865a',
  maple_logs:      '#b86830',
  raw_beef:        '#b33b2a',
  cooked_beef:     '#7a3318',
  raw_chicken:     '#e6c8a0',
  cooked_chicken:  '#b08a4a',
  bread:           '#c89850',
  baked_potato:    '#c8a880',
  trout:           '#789ab8',
  bronze_cutlass:  '#b8763a',
  iron_cutlass:    '#6a6a70',
  steel_cutlass:   '#b8c0c8',
  bronze_handaxe:  '#b8763a',
  iron_handaxe:    '#6a6a70',
  leather_jerkin:  '#6b4423',
  bronze_hauberk:  '#b8763a',
  wooden_buckler:  '#8a5a2b',
  bones:           '#e8e0c4',
  big_bones:       '#d8d0b4',
  feathers:        '#f0f0e0',
  coins:           '#f5c542',
  goblin_tooth:    '#e0d8a0',
  wolf_pelt:       '#7a7268',
  hearthmoor_key:  '#a0a0a8',
  wyrdstone_shard: '#9fdfff',
  edda_locket:     '#c0c0d0',
  map_fragment:    '#d8c8a0',
};

// Skill display name mapping: systems use lowercase internal names,
// the Stats panel displays OSRS CapitalCase.
const SKILL_DISPLAY = {
  attack:      'Attack',
  strength:    'Strength',
  defence:     'Defence',
  hitpoints:   'Hitpoints',
  woodcutting: 'Woodcut',
};

// Spawn ID → data/npcs.js id bridge (Areas.js predates npcs.js)
const NPC_ID_BRIDGE = {
  questGiverHans: 'edda_marrowhite',
};

// =============================================================
// GAME STATE
// =============================================================

export const GameState = {
  // engine
  scene: null, renderer: null, threeCam: null,
  camera: null, input: null,
  clock: new THREE.Clock(), dt: 0, elapsed: 0, running: false,

  // world
  world: null,          // { tiles, spawns, spawnPoint } from defineWorld()
  terrain: null,        // THREE.Group from createTerrain()

  // player
  player: null,         // plain data object (PlayerState)
  playerMesh: null,     // THREE.Group (createPlayerModel)
  playerPath: [],       // remaining tile steps
  playerTarget: null,   // current movement target tile
  playerAction: null,   // {type:'attack'|'chop'|'talk', targetId}
  playerAttackCD: 0,    // ticks until next swing (integer)

  // smooth visual tween between logical tile cells (rAF interp)
  playerTween: null,    // { fromX, fromZ, toX, toZ, t0, dur }
  tickCount: 0,         // monotonic logical tick counter
  saveTickCounter: 0,

  // gameplay entities
  npcs: [],             // [{ id, dataId, mesh, x, z, name }]
  monsters: [],         // [{ instanceId, dataId, mesh, x, z, hp, maxHp, spawnTile, respawnAt?, ai }]
  resources: [],        // [{ id, kind:'tree'|'oakTree', mesh, x, z, stumpMesh?, respawnAt? }]
  loot: [],             // [{ id, mesh, itemId, qty, x, z, expiresAt }]

  // systems + ui
  systems: {},          // populated by createSystems()
  graphics: { materials: MAT },
  ui: null,             // populated by createHUD()
  hud: null,            // API object from createHUD

  // click dispatch
  leftClickHandlers:  [],
  rightClickHandlers: [],

  // autosave timer
  saveTimer: 0,

  // entity id counter
  _entityId: 0,
};

if (typeof window !== 'undefined') {
  window.GameState = GameState;
  window.THREE = THREE;
}

// =============================================================
// COORD HELPERS
// =============================================================

function tileToWorld(tx, tz) {
  return {
    x: (tx + 0.5) * TILE_SIZE - HALF_WORLD,
    z: (tz + 0.5) * TILE_SIZE - HALF_WORLD,
  };
}

function worldToTile(wx, wz) {
  return {
    x: Math.floor((wx + HALF_WORLD) / TILE_SIZE),
    z: Math.floor((wz + HALF_WORLD) / TILE_SIZE),
  };
}

function isTileWalkable(tx, tz) {
  if (tx < 0 || tz < 0 || tx >= WORLD_SIZE || tz >= WORLD_SIZE) return false;
  const w = GameState.world;
  if (!w) return false;
  const type = w.tiles[tz][tx];
  if (!TILE_WALKABLE[type]) return false;
  // Block on live (un-felled) trees
  for (const r of GameState.resources) {
    if (r.felled) continue;
    if (r.x === tx && r.z === tz) return false;
  }
  // Block on live monsters
  for (const m of GameState.monsters) {
    if (m.hp <= 0) continue;
    if (m.x === tx && m.z === tz) return false;
  }
  return true;
}

function nextEntityId() {
  return ++GameState._entityId;
}

// =============================================================
// BOOT
// =============================================================

function boot() {
  const introModal = document.getElementById('intro-modal');
  const startBtn   = document.getElementById('start-btn');
  const loading    = document.getElementById('loading');

  if (loading) loading.textContent = 'Click "Enter World" to begin.';

  if (!startBtn) {
    console.error('[Wyrdscape] start button missing');
    return;
  }

  startBtn.addEventListener('click', () => {
    if (introModal) introModal.classList.add('hidden');
    if (loading) loading.classList.add('hidden');
    try { startGame(); }
    catch (err) {
      console.error('[Wyrdscape] boot error', err);
      showFatal(err);
    }
  }, { once: true });
}

function showFatal(err) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:#0a0a0a;color:#ffb83f;font-family:monospace;padding:30px;z-index:9999;overflow:auto;';
  div.innerHTML = '<h2>Wyrdscape failed to start</h2><pre>' +
    String(err && (err.stack || err.message || err)) + '</pre>';
  document.body.appendChild(div);
}

// =============================================================
// START GAME
// =============================================================

function startGame() {
  const mount = document.getElementById('game-container');
  if (!mount) throw new Error('#game-container missing');

  // ---- engine ----
  const { scene, renderer, camera: threeCam, dirLight, ambLight } = createScene(mount);
  GameState.scene    = scene;
  GameState.renderer = renderer;
  GameState.threeCam = threeCam;
  GameState.dirLight = dirLight;
  GameState.ambLight = ambLight;

  // ---- world ----
  const worldDef = defineWorld();
  GameState.world = worldDef;
  const terrain = createTerrain(worldDef);
  scene.add(terrain);
  GameState.terrain = terrain;

  // ---- player data (with save load) ----
  const savedPlayer = loadGame();
  const player = savedPlayer || defaultPlayerState();
  // Migrate legacy camelCase inventory items if loaded from old saves
  normalizeInventory(player);
  // Always use defined spawn point if no save exists
  if (!savedPlayer) {
    player.x = worldDef.spawnPoint.x;
    player.z = worldDef.spawnPoint.z;
    player.inventory = STARTER_INVENTORY.map((s) => ({ ...s }));
  }
  // New fields introduced by integration layer
  if (!player.quests) player.quests = {};
  if (player.hp == null) player.hp = 10;
  if (player.maxHp == null) {
    player.maxHp = player.skills?.hitpoints?.level ?? 10;
  }
  GameState.player = player;

  // ---- player mesh ----
  const playerMesh = createPlayerModel({ hasSword: true });
  const pw = tileToWorld(player.x, player.z);
  playerMesh.position.set(pw.x, 0, pw.z);
  playerMesh.traverse((o) => {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = false; }
  });
  scene.add(playerMesh);
  GameState.playerMesh = playerMesh;

  // ---- camera + input ----
  GameState.camera = createCamera(threeCam, playerMesh);
  GameState.input  = createInput(renderer.domElement, GameState.camera);

  // ---- spawn world entities ----
  spawnEntities(worldDef, scene);

  // ---- buildings (cosmetic, matching tile layout in Areas.js) ----
  addBuildings(scene);

  // ---- systems (thin adapters) ----
  GameState.systems = createSystems();

  // ---- UI ----
  GameState.hud = createHUD(GameState);
  GameState.ui  = { update: GameState.hud.update };
  refreshHUD();

  // ---- click handlers ----
  wireClickHandlers();

  // ---- welcome ----
  GameState.hud.addChatMessage(savedPlayer
    ? 'Welcome back to Wyrdscape.'
    : 'Welcome to Wyrdscape. Your story begins at Hearthmoor.',
    'system');
  GameState.hud.addChatMessage('Left-click the ground to walk. Right-click for actions.', 'system');

  // ---- loop ----
  GameState.running = true;
  GameState.clock.start();
  requestAnimationFrame(tick);

  console.log('[Wyrdscape] engine running');
}

// =============================================================
// SYSTEMS ADAPTER
// =============================================================

function createSystems() {
  return {
    combat: {
      // Attack the currently-targeted monster if player is adjacent.
      // Called once per LOGIC tick (600ms).
      update() {
        if (GameState.playerAttackCD > 0) GameState.playerAttackCD--;
        const action = GameState.playerAction;
        if (!action || action.type !== 'attack') return;

        const target = GameState.monsters.find((m) => m.instanceId === action.targetId);
        if (!target) { GameState.playerAction = null; return; }
        if (target.hp <= 0) { GameState.playerAction = null; return; }

        // Must be adjacent and not still walking
        if (GameState.playerPath.length > 0) return;
        if (!isAdjacent(GameState.player.x, GameState.player.z, target.x, target.z)) {
          // Re-issue path to target
          walkTowardEntity(target);
          return;
        }

        if (GameState.playerAttackCD > 0) return;

        // Face target
        facePlayerAt(target.x, target.z);

        // Resolve attack
        const def = MONSTERS[target.dataId] || {};
        const stats = {
          attack:  def.attack  ?? 1,
          defence: def.defence ?? 1,
          maxHit:  def.maxHit  ?? 1,
        };
        const res = tryAttack(GameState.player, stats, GameState);
        target.hp = Math.max(0, target.hp - res.damage);

        // Hit splat on monster head
        const headPos = new THREE.Vector3();
        target.mesh.getWorldPosition(headPos);
        headPos.y += 2.0;
        uiCreateHitSplat(headPos, res.damage, res.damage > 0 ? 'damage' : 'miss',
          GameState.threeCam, { renderer: GameState.renderer });

        // XP: always strength for now, + hp xp
        if (res.damage > 0) {
          gainXp(GameState.player, 'strength', res.damage * 4);
          gainXp(GameState.player, 'hitpoints', Math.floor(res.damage * 1.33));
          GameState.hud.updateStats(mapSkillsForUI(GameState.player.skills));
        }

        if (target.hp <= 0) {
          handleMonsterDeath(target);
          GameState.playerAction = null;
        } else {
          // Monster retaliates
          const retaliate = tryAttack(stats, GameState.player, GameState);
          if (retaliate.damage > 0) {
            // Head splat on player
            const pHead = new THREE.Vector3();
            GameState.playerMesh.getWorldPosition(pHead);
            pHead.y += 2.3;
            uiCreateHitSplat(pHead, retaliate.damage, 'damage',
              GameState.threeCam, { renderer: GameState.renderer });
          }
          if (GameState.player.hp <= 0) {
            handlePlayerDeath();
          }
          GameState.hud.updateHP(GameState.player.hp, GameState.player.maxHp);
        }

        GameState.playerAttackCD = ATTACK_TICKS;
      },
    },

    skills: {
      update() { /* skills tick passively via gainXp */ },
    },

    inventory: {
      add(itemId, qty = 1) {
        const ok = addItem(GameState.player.inventory, itemId, qty, ITEMS);
        GameState.hud.updateInventory(buildInventoryView(), itemLookup());
        return ok;
      },
      removeAt(slotIdx) {
        const removed = removeItem(GameState.player.inventory, slotIdx);
        GameState.hud.updateInventory(buildInventoryView(), itemLookup());
        return removed;
      },
      eat(slotIdx) {
        const slot = GameState.player.inventory[slotIdx];
        if (!slot) return false;
        const def = ITEMS[slot.id];
        if (!def || !def.heal) return false;
        const heal = def.heal;
        const p = GameState.player;
        if (p.hp >= p.maxHp) {
          GameState.hud.addChatMessage('You are already at full health.', 'warning');
          return false;
        }
        p.hp = Math.min(p.maxHp, p.hp + heal);
        removeItem(GameState.player.inventory, slotIdx);
        GameState.hud.addChatMessage('You eat the ' + def.name.toLowerCase() + '.', 'game');
        GameState.hud.updateHP(p.hp, p.maxHp);
        GameState.hud.updateInventory(buildInventoryView(), itemLookup());
        return true;
      },
      update() {},
    },

    save: {
      // Called once per LOGIC tick. Autosave is silent — players
      // don't want chat spam every 10 seconds. Manual saveNow()
      // shows a confirmation message because the player asked for it.
      update() {
        GameState.saveTickCounter++;
        if (GameState.saveTickCounter >= SAVE_TICKS) {
          GameState.saveTickCounter = 0;
          saveGame(GameState.player);
        }
      },
      saveNow() {
        saveGame(GameState.player);
        if (GameState.hud) GameState.hud.addChatMessage('Game saved.', 'system');
      },
      reset() { clearSave(); },
    },
  };
}

// =============================================================
// SAVE MIGRATION
// =============================================================

function normalizeInventory(player) {
  if (!player || !Array.isArray(player.inventory)) return;
  const map = {
    bronzeSword:  'bronze_cutlass',
    bronzeAxe:    'bronze_handaxe',
    cookedBeef:   'cooked_beef',
    rawBeef:      'raw_beef',
  };
  for (const slot of player.inventory) {
    if (slot && map[slot.id]) slot.id = map[slot.id];
  }
  if (player.equipped && player.equipped.weapon) {
    if (map[player.equipped.weapon]) {
      player.equipped.weapon = map[player.equipped.weapon];
    }
  }
}

// =============================================================
// HUD BRIDGE
// =============================================================

function refreshHUD() {
  const p = GameState.player;
  GameState.hud.updateHP(p.hp, p.maxHp);
  GameState.hud.updatePrayer(1, 1);
  GameState.hud.updateRun(100, 100);
  GameState.hud.updateInventory(buildInventoryView(), itemLookup());
  GameState.hud.updateStats(mapSkillsForUI(p.skills));
}

// Convert systems-style inventory (dense [{id,qty}]) into a 28-slot
// array with nulls for empty slots so the UI grid lays out correctly.
function buildInventoryView() {
  const inv = GameState.player.inventory || [];
  const out = new Array(MAX_SLOTS).fill(null);
  for (let i = 0; i < Math.min(inv.length, MAX_SLOTS); i++) {
    out[i] = inv[i] ? { ...inv[i] } : null;
  }
  return out;
}

// Build an items lookup table in the format the UI expects
// (merging data/items.js with a color for each slot).
function itemLookup() {
  const out = {};
  for (const id in ITEMS) {
    const def = ITEMS[id];
    out[id] = {
      name:  def.name,
      color: ITEM_COLORS[id] || '#8b6a3b',
    };
  }
  return out;
}

// Convert systems-skills (lowercase, {level,xp}) to the CapitalCase
// shape the Stats panel expects.
function mapSkillsForUI(skills) {
  if (!skills) return {};
  const out = {};
  for (const key in skills) {
    const s = skills[key];
    const display = SKILL_DISPLAY[key] || (key[0].toUpperCase() + key.slice(1));
    const nextLvl = (s.level || 1) + 1;
    out[display] = {
      level: s.level,
      max:   s.level,
      xp:    s.xp,
      xpNext: xpForLevel(nextLvl),
    };
  }
  return out;
}

// =============================================================
// ENTITY SPAWN
// =============================================================

function spawnEntities(worldDef, scene) {
  for (const spawn of worldDef.spawns) {
    const { x, z, type, npcId } = spawn;
    const pw = tileToWorld(x, z);

    if (type === 'npc') {
      const dataId = NPC_ID_BRIDGE[npcId] || npcId;
      const def = NPCS[dataId];
      // Quest-giving NPCs get warm brown tunics; ambient
      // village folk (no definition in NPCS) get a muted gray
      // so the player can read at a glance who's interactive.
      const colors = def
        ? { tunicColor: 0x5a3a1f, hairColor: 0x2a1a08, legColor: 0x3a2a18 }
        : { tunicColor: 0x6a6a6a, hairColor: 0x3a2810, legColor: 0x4a4a4a };
      const mesh = createPlayerModel(colors);
      mesh.position.set(pw.x, 0, pw.z);
      mesh.rotation.y = Math.PI;
      mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(mesh);
      GameState.npcs.push({
        id: nextEntityId(),
        dataId,
        name: def?.name || 'Villager',
        ambient: !def,
        mesh, x, z,
      });
    }
    else if (type === 'tree' || type === 'oakTree') {
      const mesh = type === 'oakTree' ? createOakTreeModel() : createTreeModel();
      mesh.position.set(pw.x, 0, pw.z);
      mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      scene.add(mesh);
      GameState.resources.push({
        id: nextEntityId(),
        kind: type,
        mesh, x, z,
        logs: type === 'oakTree' ? 'oak_logs' : 'logs',
        wcXp: type === 'oakTree' ? 37 : 25,
        levelReq: type === 'oakTree' ? 15 : 1,
      });
    }
    else if (MONSTERS[type]) {
      spawnMonster(type, x, z, scene);
    }
  }
}

function spawnMonster(dataId, x, z, scene) {
  const def = MONSTERS[dataId];
  if (!def) return;
  let mesh;
  switch (dataId) {
    case 'cow':     mesh = createCowModel();     break;
    case 'chicken': mesh = createChickenModel(); break;
    case 'goblin':  mesh = createGoblinModel();  break;
    default:        mesh = createGoblinModel();  break; // fallback
  }
  const pw = tileToWorld(x, z);
  mesh.position.set(pw.x, 0, pw.z);
  mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  scene.add(mesh);
  GameState.monsters.push({
    instanceId: nextEntityId(),
    dataId,
    name: def.name,
    mesh,
    x, z,
    spawnTile: { x, z },
    hp: def.hp,
    maxHp: def.hp,
    wanderCD: Math.floor(Math.random() * 5),
  });
}

function addBuildings(scene) {
  // Two town buildings NW + one long hall — matches Areas.js
  const b1 = createBuildingModel(4, 4, 3);
  const p1 = tileToWorld(7.5, 7.5);
  b1.position.set(p1.x, 0, p1.z);
  b1.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b1);

  const b2 = createBuildingModel(4, 4, 3);
  const p2 = tileToWorld(12.5, 7.5);
  b2.position.set(p2.x, 0, p2.z);
  b2.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b2);

  const b3 = createBuildingModel(7, 4, 3);
  const p3 = tileToWorld(10, 12.5);
  b3.position.set(p3.x, 0, p3.z);
  b3.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(b3);
}

// =============================================================
// INPUT / CLICK
// =============================================================

function wireClickHandlers() {
  // left-click handler (ground move / default action)
  GameState.input.setLeftClickHandler((event) => {
    handleLeftClick(event);
  });
  GameState.input.setRightClickHandler((event) => {
    handleRightClick(event);
  });
}

function handleLeftClick(event) {
  GameState.hud.hideContextMenu();
  // Raycast all scene children
  const hits = GameState.input.screenToWorld(event, GameState.scene);
  const pick = pickFirstInteractable(hits);
  if (!pick) return;

  if (pick.kind === 'monster') {
    beginAttack(pick.entity);
  } else if (pick.kind === 'npc') {
    beginTalk(pick.entity);
  } else if (pick.kind === 'resource') {
    beginChop(pick.entity);
  } else if (pick.kind === 'loot') {
    beginPickup(pick.entity);
  } else {
    // Ground click — walk
    const w = hits[0]?.point;
    if (!w) return;
    const t = worldToTile(w.x, w.z);
    walkTo(t.x, t.z);
    // Cyan tile indicator at that tile
    const tw = tileToWorld(t.x, t.z);
    Effects.createTileSelectIndicator(GameState.scene,
      new THREE.Vector3(tw.x, 0.05, tw.z), TILE_SIZE * 0.9);
  }
}

function handleRightClick(event) {
  const hits = GameState.input.screenToWorld(event, GameState.scene);
  const pick = pickFirstInteractable(hits);
  const options = [];
  let header = 'Ground';

  if (pick?.kind === 'monster') {
    header = pick.entity.name;
    options.push({
      label: 'Attack ' + pick.entity.name,
      color: 'yellow',
      action: () => beginAttack(pick.entity),
    });
    options.push({
      label: 'Walk here',
      color: 'white',
      action: () => walkTo(pick.entity.x, pick.entity.z),
    });
  } else if (pick?.kind === 'npc') {
    header = pick.entity.name;
    options.push({
      label: 'Talk-to ' + pick.entity.name,
      color: 'yellow',
      action: () => beginTalk(pick.entity),
    });
  } else if (pick?.kind === 'resource') {
    header = pick.entity.kind === 'oakTree' ? 'Oak Tree' : 'Tree';
    options.push({
      label: 'Chop ' + header,
      color: 'yellow',
      action: () => beginChop(pick.entity),
    });
  } else if (pick?.kind === 'loot') {
    const def = ITEMS[pick.entity.itemId];
    header = def?.name || 'Item';
    options.push({
      label: 'Take ' + header,
      color: 'yellow',
      action: () => beginPickup(pick.entity),
    });
  } else if (hits[0]) {
    const t = worldToTile(hits[0].point.x, hits[0].point.z);
    options.push({
      label: 'Walk here',
      color: 'yellow',
      action: () => walkTo(t.x, t.z),
    });
  }

  GameState.hud.showContextMenu(event.clientX, event.clientY, options, header);
}

// Walk the object hierarchy up from the hit mesh to find a gameplay
// entity: monster, npc, resource, or loot drop. We tag entities by
// matching Group references.
function pickFirstInteractable(hits) {
  for (const h of hits) {
    let obj = h.object;
    while (obj) {
      // monsters
      const mon = GameState.monsters.find((m) => m.mesh === obj);
      if (mon) return { kind: 'monster', entity: mon };
      const npc = GameState.npcs.find((n) => n.mesh === obj);
      if (npc) return { kind: 'npc', entity: npc };
      const res = GameState.resources.find((r) => r.mesh === obj);
      if (res) return { kind: 'resource', entity: res };
      const lt = GameState.loot.find((l) => l.mesh === obj);
      if (lt) return { kind: 'loot', entity: lt };
      obj = obj.parent;
    }
  }
  return null;
}

// =============================================================
// PLAYER ACTIONS
// =============================================================

function walkTo(tx, tz) {
  const path = findPath(
    GameState.player.x, GameState.player.z,
    tx, tz,
    isTileWalkable,
  );
  GameState.playerPath = path;
  GameState.playerTarget = path.length > 0 ? path[path.length - 1] : null;
  GameState.playerMoveT = 0;
  GameState.playerAction = null;
}

function walkTowardEntity(entity) {
  // Target the nearest walkable neighbor of the entity tile
  const p = GameState.player;
  const path = findPath(p.x, p.z, entity.x, entity.z, isTileWalkable);
  GameState.playerPath = path;
  GameState.playerTarget = path.length > 0 ? path[path.length - 1] : null;
  GameState.playerMoveT = 0;
}

function beginAttack(monster) {
  GameState.playerAction = { type: 'attack', targetId: monster.instanceId };
  if (!isAdjacent(GameState.player.x, GameState.player.z, monster.x, monster.z)) {
    walkTowardEntity(monster);
  }
}

function beginTalk(npc) {
  GameState.playerAction = { type: 'talk', targetId: npc.id };
  if (!isAdjacent(GameState.player.x, GameState.player.z, npc.x, npc.z)) {
    walkTowardEntity(npc);
    return;
  }
  openDialogue(npc);
}

function beginChop(resource) {
  GameState.playerAction = { type: 'chop', targetId: resource.id };
  if (!isAdjacent(GameState.player.x, GameState.player.z, resource.x, resource.z)) {
    walkTowardEntity(resource);
  }
}

function beginPickup(loot) {
  GameState.playerAction = { type: 'pickup', targetId: loot.id };
  if (GameState.player.x !== loot.x || GameState.player.z !== loot.z) {
    walkTo(loot.x, loot.z);
  }
}

// =============================================================
// MONSTER DEATH & LOOT
// =============================================================

function handleMonsterDeath(monster) {
  const def = MONSTERS[monster.dataId];
  if (def) {
    gainXp(GameState.player, 'strength', Math.floor(def.xp * 0.5));
    gainXp(GameState.player, 'attack',   Math.floor(def.xp * 0.25));
    gainXp(GameState.player, 'hitpoints', Math.floor(def.xp * 0.25));
    GameState.hud.updateStats(mapSkillsForUI(GameState.player.skills));

    const drops = rollDrops(monster.dataId);
    for (const d of drops) {
      dropLoot(d.item, d.quantity, monster.x, monster.z);
    }
  }

  GameState.hud.addChatMessage('You defeated the ' + (def?.name || 'monster') + '.', 'game');

  // Remove from scene, schedule respawn
  GameState.scene.remove(monster.mesh);
  const idx = GameState.monsters.indexOf(monster);
  if (idx >= 0) GameState.monsters.splice(idx, 1);

  GameState.player.totalKills = (GameState.player.totalKills || 0) + 1;

  // Respawn after monster's respawn time
  const respawnMs = def?.respawnMs || 30000;
  setTimeout(() => {
    spawnMonster(monster.dataId, monster.spawnTile.x, monster.spawnTile.z, GameState.scene);
  }, respawnMs);
}

function handlePlayerDeath() {
  GameState.hud.addChatMessage('Oh dear, you are dead.', 'warning');
  GameState.player.hp = GameState.player.maxHp;
  const sp = GameState.world.spawnPoint;
  GameState.player.x = sp.x;
  GameState.player.z = sp.z;
  const pw = tileToWorld(sp.x, sp.z);
  GameState.playerMesh.position.set(pw.x, 0, pw.z);
  GameState.playerPath = [];
  GameState.playerAction = null;
  GameState.hud.updateHP(GameState.player.hp, GameState.player.maxHp);
}

function dropLoot(itemId, qty, tx, tz) {
  let mesh;
  if (itemId === 'coins')         mesh = createCoinDrop();
  else if (itemId === 'logs' || itemId === 'oak_logs') mesh = createLogDrop();
  else if (itemId === 'raw_beef' || itemId === 'raw_chicken') mesh = createMeatDrop();
  else if (itemId === 'bones' || itemId === 'big_bones') mesh = createBoneDrop();
  else                            mesh = createCoinDrop(); // generic fallback

  const pw = tileToWorld(tx, tz);
  mesh.position.set(pw.x, 0, pw.z);
  mesh.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  GameState.scene.add(mesh);
  GameState.loot.push({
    id: nextEntityId(),
    mesh, itemId, qty,
    x: tx, z: tz,
    expiresAt: GameState.elapsed + 120, // 2 min
  });
}

// =============================================================
// RESOURCE CHOP (trees)
// =============================================================

// Logical-tick chop ticker. Cooldown is in integer ticks.
function tickChop() {
  const action = GameState.playerAction;
  if (!action || action.type !== 'chop') return;
  const res = GameState.resources.find((r) => r.id === action.targetId);
  if (!res || res.felled) { GameState.playerAction = null; return; }
  if (GameState.playerPath.length > 0) return;
  if (!isAdjacent(GameState.player.x, GameState.player.z, res.x, res.z)) {
    walkTowardEntity(res);
    return;
  }
  if (GameState.playerAttackCD > 0) return;

  facePlayerAt(res.x, res.z);

  const wc = GameState.player.skills.woodcutting.level;
  if (wc < res.levelReq) {
    GameState.hud.addChatMessage('You need woodcutting level ' + res.levelReq + ' to chop this.', 'warning');
    GameState.playerAction = null;
    return;
  }

  // 50% per tick (matches OSRS feel)
  if (Math.random() < 0.5) {
    const ok = GameState.systems.inventory.add(res.logs, 1);
    if (ok) {
      gainXp(GameState.player, 'woodcutting', res.wcXp);
      GameState.hud.updateStats(mapSkillsForUI(GameState.player.skills));
      const def = ITEMS[res.logs];
      GameState.hud.addChatMessage('You get some ' + (def?.name || 'logs').toLowerCase() + '.', 'game');

      // Remove tree, drop stump, schedule respawn
      GameState.scene.remove(res.mesh);
      const stump = createTreeStumpModel();
      const pw = tileToWorld(res.x, res.z);
      stump.position.set(pw.x, 0, pw.z);
      stump.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      GameState.scene.add(stump);
      res.mesh = stump;
      res.felled = true;
      setTimeout(() => {
        // Respawn the tree
        GameState.scene.remove(res.mesh);
        const revive = res.kind === 'oakTree' ? createOakTreeModel() : createTreeModel();
        revive.position.set(pw.x, 0, pw.z);
        revive.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        GameState.scene.add(revive);
        res.mesh = revive;
        res.felled = false;
      }, res.kind === 'oakTree' ? 15000 : 10000);

      GameState.playerAction = null;
    } else {
      GameState.hud.addChatMessage('Your inventory is full.', 'warning');
      GameState.playerAction = null;
    }
  }
  GameState.playerAttackCD = CHOP_TICKS;
}

// =============================================================
// DIALOGUE (very simple modal)
// =============================================================

function openDialogue(npc) {
  const def = NPCS[npc.dataId];
  if (!def) {
    // Ambient villagers without dialogue data get a friendly default.
    GameState.hud.addChatMessage('<' + (npc.name || 'Villager') + '> Hello, traveller.', 'game');
    GameState.playerAction = null;
    return;
  }
  const node = def.dialogue[0];
  if (!node) return;
  GameState.hud.addChatMessage('<' + def.name + '> ' + node.text, 'game');
  GameState.playerAction = null;
}

// =============================================================
// PICKUP
// =============================================================

function tickPickup() {
  const action = GameState.playerAction;
  if (!action || action.type !== 'pickup') return;
  const loot = GameState.loot.find((l) => l.id === action.targetId);
  if (!loot) { GameState.playerAction = null; return; }
  if (GameState.playerPath.length > 0) return;
  if (GameState.player.x !== loot.x || GameState.player.z !== loot.z) return;

  const ok = GameState.systems.inventory.add(loot.itemId, loot.qty);
  if (ok) {
    const def = ITEMS[loot.itemId];
    GameState.hud.addChatMessage('You pick up ' + (def?.name || loot.itemId) + '.', 'game');
    GameState.scene.remove(loot.mesh);
    const idx = GameState.loot.indexOf(loot);
    if (idx >= 0) GameState.loot.splice(idx, 1);
  } else {
    GameState.hud.addChatMessage('Your inventory is full.', 'warning');
  }
  GameState.playerAction = null;
}

// =============================================================
// MOVEMENT
// =============================================================

// Logical tick: pop one tile from the player's path and start a
// visual tween. Called once per LOGIC_TICK_MS.
function stepPlayerLogic() {
  const p = GameState.player;
  if (GameState.playerPath.length === 0) return;
  const next = GameState.playerPath.shift();
  const from = tileToWorld(p.x, p.z);
  const to   = tileToWorld(next.x, next.z);
  p.x = next.x;
  p.z = next.z;
  GameState.playerTween = {
    fromX: from.x, fromZ: from.z,
    toX:   to.x,   toZ:   to.z,
    t0:    performance.now(),
    dur:   LOGIC_TICK_MS,
  };
  // Face movement direction
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) + Math.abs(dz) > 0.001) {
    GameState.playerMesh.rotation.y = Math.atan2(dx, dz);
  }
}

// Per-frame: smoothly interpolate the player mesh along its current
// tween. Called every rAF.
function tweenPlayerVisual() {
  const tw = GameState.playerTween;
  if (!tw) return;
  const t = Math.min(1, (performance.now() - tw.t0) / tw.dur);
  GameState.playerMesh.position.x = tw.fromX + (tw.toX - tw.fromX) * t;
  GameState.playerMesh.position.z = tw.fromZ + (tw.toZ - tw.fromZ) * t;
  if (t >= 1) {
    GameState.playerMesh.position.set(tw.toX, 0, tw.toZ);
    GameState.playerTween = null;
  }
}

function facePlayerAt(tx, tz) {
  const from = tileToWorld(GameState.player.x, GameState.player.z);
  const to   = tileToWorld(tx, tz);
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  if (Math.abs(dx) + Math.abs(dz) > 0.001) {
    GameState.playerMesh.rotation.y = Math.atan2(dx, dz);
  }
}

// =============================================================
// MONSTER AI (idle wander + simple aggro)
// =============================================================

// Logical-tick monster AI. wanderCD is in integer ticks.
function tickMonsters() {
  for (const m of GameState.monsters) {
    if (m.hp <= 0) continue;
    m.wanderCD = (m.wanderCD || 0) - 1;
    if (m.wanderCD > 0) continue;
    m.wanderCD = 5 + Math.floor(Math.random() * 5); // 5..9 ticks (~3..5s)

    // Aggressive monsters close the distance to the player
    const def = MONSTERS[m.dataId];
    if (def?.aggressive) {
      const d = tileDist(m.x, m.z, GameState.player.x, GameState.player.z);
      if (d <= (def.aggroRange || 4) && d > 1) {
        // Step one tile toward player
        const dx = Math.sign(GameState.player.x - m.x);
        const dz = Math.sign(GameState.player.z - m.z);
        const nx = m.x + dx;
        const nz = m.z + dz;
        if (isTileWalkable(nx, nz)) moveMonsterTo(m, nx, nz);
        continue;
      }
    }

    // Wander 1 tile in a random direction
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    const [wx, wz] = dirs[Math.floor(Math.random() * 4)];
    const nx = m.x + wx;
    const nz = m.z + wz;
    // Stay within ~4 tiles of spawn
    if (Math.abs(nx - m.spawnTile.x) > 4) continue;
    if (Math.abs(nz - m.spawnTile.z) > 4) continue;
    if (isTileWalkable(nx, nz)) moveMonsterTo(m, nx, nz);
  }
}

function moveMonsterTo(m, tx, tz) {
  m.x = tx; m.z = tz;
  const pw = tileToWorld(tx, tz);
  m.mesh.position.x = pw.x;
  m.mesh.position.z = pw.z;
}

// =============================================================
// LOOT EXPIRY
// =============================================================

// Loot expires by tick count, not wall-clock seconds.
function tickLoot() {
  for (let i = GameState.loot.length - 1; i >= 0; i--) {
    const l = GameState.loot[i];
    if (GameState.tickCount >= l.expiresAt) {
      GameState.scene.remove(l.mesh);
      GameState.loot.splice(i, 1);
    }
  }
}

// =============================================================
// MAIN LOOP
// =============================================================

// Hot-fix: tick() called tickPlayerMovement(dt) but it was never
// defined, which crashed the entire rAF loop on the first frame.
// This wrapper drives the per-frame visual tween every rAF and
// accumulates dt to step the OSRS-style logic tick every 600ms.
let _logicTickAccum = 0;
function tickPlayerMovement(dt) {
  tweenPlayerVisual();
  _logicTickAccum += dt;
  while (_logicTickAccum >= LOGIC_TICK_SEC) {
    _logicTickAccum -= LOGIC_TICK_SEC;
    stepPlayerLogic();
    GameState.tickCount++;
  }
}

function tick() {
  if (!GameState.running) return;
  const dt = Math.min(GameState.clock.getDelta(), 0.1);
  GameState.dt = dt;
  GameState.elapsed += dt;

  // Engine
  GameState.input.update(dt);
  tickPlayerMovement(dt);
  GameState.camera.update(dt);

  // World
  if (GameState.terrain?.update) GameState.terrain.update(dt);

  // Systems
  GameState.systems.combat.update(dt);
  tickChop(dt);
  tickPickup();
  tickMonsters(dt);
  tickLoot();
  GameState.systems.save.update(dt);

  // Graphics effects (hit splats, click marker pulses)
  Effects.update(dt);

  // UI
  if (GameState.ui?.update) GameState.ui.update(dt, GameState.elapsed);

  GameState.renderer.render(GameState.scene, GameState.threeCam);
  requestAnimationFrame(tick);
}

// =============================================================
// DOM ready
// =============================================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
