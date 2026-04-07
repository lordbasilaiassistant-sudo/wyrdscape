// =============================================================
// src/ui/Stats.js
// 3-column skill grid panel, OSRS-style.
//   createStatsPanel() -> { element, render }
//
//   render(skills)
//     skills: object keyed by skill name, each entry:
//       { level, max, xp, xpNext, color? }
//     Or array of { name, level, max, xp, xpNext, color? }.
//
// Cells show: skill name, current/max level (gold), XP bar, total
// row at the bottom.
//
// Owned by: ui-builder
// =============================================================

const DEFAULT_SKILLS = [
  { name: 'Attack',     color: '#c84040' },
  { name: 'Strength',   color: '#40c878' },
  { name: 'Defence',    color: '#4080c8' },
  { name: 'Hitpoints',  color: '#c83838' },
  { name: 'Ranged',     color: '#608030' },
  { name: 'Magic',      color: '#7848c8' },
  { name: 'Prayer',     color: '#c8c050' },
  { name: 'Cooking',    color: '#a040a0' },
  { name: 'Woodcut',    color: '#608040' },
  { name: 'Fishing',    color: '#4090c8' },
  { name: 'Firemaking', color: '#c87030' },
  { name: 'Crafting',   color: '#a07840' },
  { name: 'Smithing',   color: '#909090' },
  { name: 'Mining',     color: '#806040' },
  { name: 'Herblore',   color: '#40a040' },
  { name: 'Agility',    color: '#4080a0' },
  { name: 'Thieving',   color: '#603880' },
  { name: 'Slayer',     color: '#404040' },
  { name: 'Farming',    color: '#308030' },
  { name: 'Runecraft',  color: '#c8b880' },
  { name: 'Hunter',     color: '#80a060' },
  { name: 'Construct',  color: '#a08060' },
];

function normalizeSkills(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills;
  return Object.keys(skills).map((name) => ({ name, ...skills[name] }));
}

export function createStatsPanel() {
  const root = document.createElement('div');
  root.className = 'ws-tab-panel ws-stats-panel';

  const heading = document.createElement('h3');
  heading.textContent = 'Stats';
  root.appendChild(heading);

  const grid = document.createElement('div');
  grid.className = 'ws-stats-grid';
  root.appendChild(grid);

  const totalRow = document.createElement('div');
  totalRow.className = 'ws-stats-total';
  totalRow.innerHTML = 'Total level: <b>0</b>';
  root.appendChild(totalRow);

  const cellMap = {}; // name -> {root, name, level, xpFill}

  function ensureCell(name, color) {
    if (cellMap[name]) return cellMap[name];
    const cell = document.createElement('div');
    cell.className = 'ws-stat-cell';
    cell.style.borderLeft = '2px solid ' + (color || '#8b6a3b');

    const nameEl  = document.createElement('div');
    nameEl.className = 'ws-stat-name';
    nameEl.textContent = name;

    const lvlEl   = document.createElement('div');
    lvlEl.className = 'ws-stat-level';
    lvlEl.textContent = '1/1';

    const barEl   = document.createElement('div');
    barEl.className = 'ws-stat-xp-bar';
    const fillEl  = document.createElement('div');
    fillEl.className = 'ws-stat-xp-fill';
    barEl.appendChild(fillEl);

    cell.appendChild(nameEl);
    cell.appendChild(lvlEl);
    cell.appendChild(barEl);

    cell.addEventListener('click', () => {
      root.dispatchEvent(new CustomEvent('stats:cell-click', {
        bubbles: true,
        detail: { skill: name },
      }));
    });

    grid.appendChild(cell);
    const entry = { root: cell, nameEl, lvlEl, fillEl, barEl };
    cellMap[name] = entry;
    return entry;
  }

  function render(skills) {
    const list = normalizeSkills(skills);
    // Seed defaults if caller hasn't supplied entries yet
    if (list.length === 0) {
      for (const def of DEFAULT_SKILLS) {
        const c = ensureCell(def.name, def.color);
        c.lvlEl.textContent = '1/1';
        c.fillEl.style.width = '0%';
      }
      totalRow.innerHTML = 'Total level: <b>' + DEFAULT_SKILLS.length + '</b>';
      return;
    }

    let total = 0;
    for (const s of list) {
      const c = ensureCell(s.name, s.color);
      const lvl = s.level || 1;
      const max = s.max != null ? s.max : lvl;
      c.lvlEl.textContent = lvl + '/' + max;
      total += lvl;

      let pct = 0;
      if (s.xpNext && s.xp != null) {
        pct = Math.max(0, Math.min(1, s.xp / s.xpNext)) * 100;
      }
      c.fillEl.style.width = pct + '%';
      c.barEl.title = (s.xp != null ? Math.floor(s.xp) : '0') +
        (s.xpNext ? ' / ' + Math.floor(s.xpNext) : '') + ' xp';
    }
    totalRow.innerHTML = 'Total level: <b>' + total + '</b>';
  }

  // Initial empty render shows defaults
  render([]);

  return {
    element: root,
    render,
  };
}
