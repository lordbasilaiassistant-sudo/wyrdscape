// =============================================================
// src/ui/HUD.js
// Top-level HTML overlay HUD for Wyrdscape.
//   createHUD(gameState) -> API
//
// Builds (and injects into #ui-overlay, creating it if absent):
//   - Top-right cluster: compass + minimap + HP/Prayer/Run orbs
//   - Right sidebar with tabs: Combat, Stats, Inventory, Equipment
//   - Bottom chat box
//   - Right-click context menu
//   - A plumbing hook for hit splats and click markers (not drawn here)
//
// Returns an API that integration code can call as gameplay events
// happen. None of this module touches the Three.js scene — it's
// purely HTML. The only THREE import lives in HitSplat.js and is
// loaded lazily so the HUD works without a 3D camera.
//
// Owned by: ui-builder
// =============================================================

import { createInventoryPanel } from './Inventory.js';
import { createStatsPanel }     from './Stats.js';
import { createChatBox }        from './Chat.js';
import { createContextMenu }    from './ContextMenu.js';

// ------- helpers --------------------------------------------------

function getOrCreateOverlay() {
  let el = document.getElementById('ui-overlay');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ui-overlay';
    document.body.appendChild(el);
  }
  return el;
}

function clamp01(n) { return Math.max(0, Math.min(1, n)); }

// ------- HUD factory ---------------------------------------------

export function createHUD(gameState) {
  const overlay = getOrCreateOverlay();

  // =========================================================
  // TOP-RIGHT CLUSTER: compass + minimap
  // =========================================================
  const cluster = document.createElement('div');
  cluster.className = 'ws-top-right-cluster';

  // Compass
  const compass = document.createElement('div');
  compass.className = 'ws-compass';
  compass.title = 'Compass — click to reset camera north';
  const letters = ['n', 'e', 's', 'w'];
  for (const l of letters) {
    const letterEl = document.createElement('div');
    letterEl.className = 'ws-compass-letter ' + l;
    letterEl.textContent = l.toUpperCase();
    compass.appendChild(letterEl);
  }
  const needle = document.createElement('div');
  needle.className = 'ws-compass-needle';
  compass.appendChild(needle);

  compass.addEventListener('click', () => {
    const cam = gameState && gameState.camera;
    if (cam && typeof cam.resetNorth === 'function') cam.resetNorth();
    else if (cam) cam.yaw = 0;
  });
  cluster.appendChild(compass);

  // Minimap
  const minimapFrame = document.createElement('div');
  minimapFrame.className = 'ws-minimap-frame';
  const minimapCanvas = document.createElement('div');
  minimapCanvas.className = 'ws-minimap-canvas';
  minimapFrame.appendChild(minimapCanvas);

  const minimapPlayer = document.createElement('div');
  minimapPlayer.className = 'ws-minimap-player';
  minimapFrame.appendChild(minimapPlayer);

  cluster.appendChild(minimapFrame);
  overlay.appendChild(cluster);

  // =========================================================
  // ORB STACK (HP / Prayer / Run)
  // =========================================================
  const orbStack = document.createElement('div');
  orbStack.className = 'ws-orb-stack';

  function makeOrb(cls, label) {
    const orb = document.createElement('div');
    orb.className = 'ws-orb ' + cls;
    const fill = document.createElement('div');
    fill.className = 'ws-orb-fill';
    fill.style.height = '100%';
    orb.appendChild(fill);
    const lbl = document.createElement('div');
    lbl.className = 'ws-orb-label';
    lbl.textContent = label;
    orb.appendChild(lbl);
    orbStack.appendChild(orb);
    return { root: orb, fill, label: lbl };
  }

  const hpOrb     = makeOrb('hp', '10');
  const prayerOrb = makeOrb('prayer', '1');
  const runOrb    = makeOrb('run', '100');
  overlay.appendChild(orbStack);

  // =========================================================
  // SIDEBAR with tabs + content panels
  // =========================================================
  const sidebar = document.createElement('div');
  sidebar.className = 'ws-sidebar';

  const tabRow = document.createElement('div');
  tabRow.className = 'ws-sidebar-tabs';

  const content = document.createElement('div');
  content.className = 'ws-sidebar-content';

  const tabs = [
    { id: 'combat',    label: 'Cmb' },
    { id: 'stats',     label: 'Stat' },
    { id: 'inventory', label: 'Inv' },
    { id: 'equipment', label: 'Equip' },
    { id: 'prayer',    label: 'Pra' },
    { id: 'magic',     label: 'Mag' },
    { id: 'settings',  label: 'Set' },
  ];
  const tabBtns   = {};
  const tabPanels = {};

  function setActiveTab(id) {
    for (const k in tabBtns)   tabBtns[k].classList.toggle('active', k === id);
    for (const k in tabPanels) tabPanels[k].classList.toggle('active', k === id);
  }

  for (const t of tabs) {
    const b = document.createElement('div');
    b.className = 'ws-tab-btn';
    b.textContent = t.label;
    b.title = t.id;
    b.addEventListener('click', () => setActiveTab(t.id));
    tabRow.appendChild(b);
    tabBtns[t.id] = b;
  }

  sidebar.appendChild(tabRow);
  sidebar.appendChild(content);
  overlay.appendChild(sidebar);

  // ---- Combat panel (simple placeholder)
  const combatPanel = document.createElement('div');
  combatPanel.className = 'ws-tab-panel';
  combatPanel.innerHTML = '<h3>Combat</h3><div style="font-size:12px;color:var(--text-cream);padding:4px 6px;">Combat style selection will appear here.<br><br>Click an enemy to attack.</div>';
  content.appendChild(combatPanel);
  tabPanels.combat = combatPanel;

  // ---- Stats panel
  const statsApi = createStatsPanel();
  content.appendChild(statsApi.element);
  tabPanels.stats = statsApi.element;

  // ---- Inventory panel
  const invApi = createInventoryPanel();
  content.appendChild(invApi.element);
  tabPanels.inventory = invApi.element;

  // ---- Equipment panel (placeholder body-silhouette)
  const equipPanel = document.createElement('div');
  equipPanel.className = 'ws-tab-panel';
  equipPanel.innerHTML = '<h3>Equipment</h3>';
  const equipSlots = [
    'Helm','Cape','Amulet',
    'Weapon','Body','Shield',
    'Legs','Gloves','Boots',
    'Ring',
  ];
  const equipGrid = document.createElement('div');
  equipGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;';
  for (const slotName of equipSlots) {
    const s = document.createElement('div');
    s.className = 'ws-inv-slot empty';
    s.title = slotName;
    s.style.fontSize = '9px';
    s.textContent = slotName.substring(0, 4);
    s.style.color = 'var(--text-mute)';
    equipGrid.appendChild(s);
  }
  equipPanel.appendChild(equipGrid);
  content.appendChild(equipPanel);
  tabPanels.equipment = equipPanel;

  // ---- Prayer placeholder
  const prayerPanel = document.createElement('div');
  prayerPanel.className = 'ws-tab-panel';
  prayerPanel.innerHTML = '<h3>Prayer</h3><div style="font-size:12px;color:var(--text-cream);padding:4px 6px;">Prayers unlock as you level the Prayer skill.</div>';
  content.appendChild(prayerPanel);
  tabPanels.prayer = prayerPanel;

  // ---- Magic placeholder
  const magicPanel = document.createElement('div');
  magicPanel.className = 'ws-tab-panel';
  magicPanel.innerHTML = '<h3>Magic</h3><div style="font-size:12px;color:var(--text-cream);padding:4px 6px;">Spellbook unlocks as you level the Magic skill.</div>';
  content.appendChild(magicPanel);
  tabPanels.magic = magicPanel;

  // ---- Settings placeholder
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'ws-tab-panel';
  settingsPanel.innerHTML = '<h3>Settings</h3>';
  const resetBtn = document.createElement('button');
  resetBtn.className = 'btn';
  resetBtn.textContent = 'Reset Save';
  resetBtn.style.cssText = 'margin:6px auto;display:block;';
  resetBtn.addEventListener('click', () => {
    if (gameState && gameState.systems && gameState.systems.save && gameState.systems.save.reset) {
      gameState.systems.save.reset();
    }
    if (confirm('Reload the page to apply reset?')) location.reload();
  });
  settingsPanel.appendChild(resetBtn);
  content.appendChild(settingsPanel);
  tabPanels.settings = settingsPanel;

  setActiveTab('inventory'); // default tab

  // =========================================================
  // CHAT BOX (bottom-left)
  // =========================================================
  const chatApi = createChatBox();
  overlay.appendChild(chatApi.element);

  // =========================================================
  // CONTEXT MENU (hidden until right-click)
  // =========================================================
  const ctxApi = createContextMenu();
  overlay.appendChild(ctxApi.element);

  // =========================================================
  // API EXPOSED TO REST OF GAME
  // =========================================================

  // ---- HP / Prayer / Run orbs ----
  function updateOrb(orb, cur, max, labelOverride) {
    const pct = max > 0 ? clamp01(cur / max) : 0;
    orb.fill.style.height = (pct * 100).toFixed(1) + '%';
    orb.label.textContent = labelOverride != null
      ? String(labelOverride)
      : String(Math.max(0, Math.round(cur)));
  }

  function updateHP(cur, max) {
    updateOrb(hpOrb, cur, max);
    if (cur <= 0) hpOrb.label.style.color = '#ff3030';
    else hpOrb.label.style.color = '';
  }
  function updatePrayer(cur, max) { updateOrb(prayerOrb, cur, max); }
  function updateRun(cur, max) {
    updateOrb(runOrb, cur, max, Math.round((max > 0 ? cur / max : 0) * 100));
  }

  // ---- Inventory / stats tab rendering ----
  function updateInventory(inventory, items) { invApi.render(inventory, items); }
  function updateStats(skills)              { statsApi.render(skills); }

  // ---- Chat ----
  function addChatMessage(text, type) { chatApi.addMessage(text, type); }

  // ---- Context menu ----
  function showContextMenu(x, y, options, header) { ctxApi.show(x, y, options, header); }
  function hideContextMenu()                      { ctxApi.hide(); }

  // ---- Minimap ----
  // Caller supplies a { x, z } world position and optional rotation
  // (radians, 0 = facing north). The player icon is fixed at
  // center so we only rotate the needle.
  function setMinimapPlayer(_worldPos, rotation) {
    const rot = rotation || 0;
    minimapPlayer.style.transform =
      'translate(-50%, -60%) rotate(' + (-rot * 180 / Math.PI) + 'deg)';
  }

  // ---- Compass rotation hook (called by game loop) ----
  function setCompassRotation(radians) {
    needle.style.transform = 'rotate(' + (-radians * 180 / Math.PI) + 'deg)';
  }

  // ---- Minimap entity dots ----
  const dotEls = [];
  function setMinimapEntities(entities /* [{x,z,type}] relative to player */) {
    // Clear old dots
    for (const d of dotEls) if (d.parentNode) d.parentNode.removeChild(d);
    dotEls.length = 0;
    if (!entities) return;
    const radius = 75; // px
    const scale  = 2.5; // world units per px
    for (const e of entities) {
      const dx = (e.x || 0) / scale;
      const dz = (e.z || 0) / scale;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > radius) continue;
      const d = document.createElement('div');
      d.className = 'ws-minimap-dot ' + (e.type || 'npc');
      d.style.left = 'calc(50% + ' + dx + 'px)';
      d.style.top  = 'calc(50% + ' + dz + 'px)';
      minimapFrame.appendChild(d);
      dotEls.push(d);
    }
  }

  // ---- Per-frame updater (called from the engine loop) ----
  function update(dt, elapsed) {
    // Drive compass from the orbital camera yaw if available
    const cam = gameState && gameState.camera;
    if (cam && typeof cam.yaw === 'number') {
      setCompassRotation(cam.yaw);
      setMinimapPlayer(null, cam.yaw);
    }
  }

  // Welcome message so the chat isn't empty on first boot
  chatApi.addMessage('Welcome to Wyrdscape.', 'system');
  chatApi.addMessage('Left-click to walk. Right-click for actions.', 'system');

  // Default orb values so the HUD isn't blank
  updateHP(10, 10);
  updatePrayer(1, 1);
  updateRun(100, 100);

  return {
    // mutation API
    updateHP,
    updatePrayer,
    updateRun,
    updateInventory,
    updateStats,
    addChatMessage,
    showContextMenu,
    hideContextMenu,
    setMinimapPlayer,
    setMinimapEntities,
    setCompassRotation,
    setActiveTab,
    update,

    // direct access for advanced use
    elements: {
      overlay,
      sidebar,
      cluster,
      chat: chatApi.element,
      contextMenu: ctxApi.element,
      minimap: minimapFrame,
      compass,
    },
    _chat: chatApi,
    _inv: invApi,
    _stats: statsApi,
    _ctx: ctxApi,
  };
}
