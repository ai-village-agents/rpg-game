import { getFloorData, getDungeonProgress, canAdvance, canEnterDungeon, getBossForFloor, isFloorCleared, DUNGEON_FLOORS } from './dungeon-floors.js';
import { renderDungeonMapPanel } from './dungeon-map.js';

const THEME_COLORS = {
  cavern: '#8B7355',
  goblin_stronghold: '#556B2F',
  crypt: '#4A4A6A',
  frozen_depths: '#87CEEB',
  ruins: '#8B8682',
  inferno: '#CD3700',
  abyss: '#2F0A28',
};

const THEME_ICONS = {
  cavern: '🪨',
  goblin_stronghold: '⚔️',
  crypt: '💀',
  frozen_depths: '❄️',
  ruins: '🏚️',
  inferno: '🔥',
  abyss: '🌀',
};

export function renderDungeonPanel(state) {
  const ds = state.dungeonState;
  if (!ds || !ds.inDungeon) return '';

  const floor = getFloorData(ds.currentFloor);
  if (!floor) return '<div class="card">Error: Invalid dungeon floor.</div>';

  const progress = getDungeonProgress(ds);
  const theme = floor.theme || 'cavern';
  const themeColor = THEME_COLORS[theme] || '#8B7355';
  const themeIcon = THEME_ICONS[theme] || '🗺️';
  const cleared = isFloorCleared(ds, ds.currentFloor);
  const bossId = getBossForFloor(ds.currentFloor);
  const canGo = canAdvance(ds);
  const { entryText, ambientMessages, clearText } = getFlavorText(floor, cleared);
  const flavorText = (() => {
    let text = '';
    if (cleared && clearText) {
      text += `<p class="dungeon-clear-text">${clearText}</p>`;
    } else if (entryText) {
      text += `<p class="dungeon-entry-text">${entryText}</p>`;
    }
    if (!cleared && ambientMessages.length > 0) {
      const ambient = ambientMessages[Math.floor(Math.random() * ambientMessages.length)];
      text += `<p class="dungeon-ambient-text">${ambient}</p>`;
    }
    return text;
  })();

  const progressBar = `<div class="dungeon-progress-bar">
    <div class="dungeon-progress-fill" style="width:${progress.percentComplete}%;background:${themeColor}"></div>
  </div>`;

  const floorListHtml = DUNGEON_FLOORS.map(f => {
    const isCurrent = f.id === ds.currentFloor;
    const isCleared = ds.floorsCleared.includes(f.id);
    const icon = isCleared ? '✅' : (isCurrent ? '👉' : (f.id <= ds.deepestFloor ? '⬜' : '🔒'));
    return `<span class="dungeon-floor-marker${isCurrent ? ' current' : ''}${isCleared ? ' cleared' : ''}" title="Floor ${f.id}: ${f.name}">${icon}</span>`;
  }).join('');

  return `
    <div class="card dungeon-panel" style="border-left:4px solid ${themeColor}">
      <h2>${themeIcon} ${floor.name} — Floor ${floor.id}</h2>
      <p class="dungeon-desc">${floor.description}</p>
      ${flavorText}
      <div class="kv">
        <div>Theme</div><div><b>${theme.replace(/_/g, ' ')}</b></div>
        <div>Difficulty</div><div><b>${floor.difficultyMultiplier}x</b></div>
        <div>Encounter Rate</div><div><b>${Math.round(floor.encounterRate * 100)}%</b></div>
        <div>Stairs Found</div><div><b>${ds.stairsFound ? '✅ Yes' : '❌ No'}</b></div>
        <div>Floor Cleared</div><div><b>${cleared ? '✅ Yes' : '❌ No'}</b></div>
        ${floor.bossFloor ? `<div>Boss</div><div><b>${bossId || 'Unknown'} ${cleared ? '(Defeated)' : '(Alive)'}</b></div>` : ''}
      </div>
      <div class="dungeon-floor-list">${floorListHtml}</div>
      ${progressBar}
      <div class="dungeon-progress-text">${progress.floorsCleared}/${progress.totalFloors} floors cleared (${progress.percentComplete}%)</div>
    </div>
    ${renderDungeonMapPanel(state)}
  `;
}

export function renderDungeonActions(state) {
  const ds = state.dungeonState;
  if (!ds || !ds.inDungeon) return '';

  const floor = getFloorData(ds.currentFloor);
  const canGo = canAdvance(ds);
  const isBossFloor = floor?.bossFloor || false;
  const bossDefeated = isFloorCleared(ds, ds.currentFloor);
  const isLastFloor = ds.currentFloor >= DUNGEON_FLOORS.length;

  let buttons = `<button id="btnDungeonSearch">Search Floor 🔍</button>`;

  if (isBossFloor && !bossDefeated) {
    buttons += `<button id="btnDungeonBoss" class="boss-btn">Fight Boss ⚔️</button>`;
  }

  if (canGo && !isLastFloor) {
    buttons += `<button id="btnDungeonAdvance">Descend ⬇️</button>`;
  }

  if (ds.currentFloor >= 11) {
    buttons += '<button id="btnDungeonMerchant" class="merchant-btn">Visit Void Merchant 🛒</button>';
  }

  buttons += `<button id="btnDungeonInventory">Inventory 🎒</button>`;
  buttons += `<button id="btnDungeonMap">Map 🗺️</button>`;
  buttons += `<button id="btnDungeonExit">Exit Dungeon 🚪</button>`;

  return `<div class="buttons">${buttons}</div>`;
}

export function attachDungeonHandlers(dispatch) {
  const search = document.getElementById('btnDungeonSearch');
  if (search) search.onclick = () => dispatch({ type: 'DUNGEON_SEARCH' });

  const boss = document.getElementById('btnDungeonBoss');
  if (boss) boss.onclick = () => dispatch({ type: 'DUNGEON_FIGHT_BOSS' });

  const advance = document.getElementById('btnDungeonAdvance');
  if (advance) advance.onclick = () => dispatch({ type: 'DUNGEON_ADVANCE' });

  const merchant = document.getElementById('btnDungeonMerchant');
  if (merchant) merchant.onclick = () => dispatch({ type: 'VIEW_SHOP', npcId: 'void_merchant' });

  const inv = document.getElementById('btnDungeonInventory');
  if (inv) inv.onclick = () => dispatch({ type: 'VIEW_INVENTORY' });

  const mapBtn = document.getElementById('btnDungeonMap');
  if (mapBtn) {
    mapBtn.onclick = () => {
      const panel = document.querySelector('.dungeon-map-panel');
      if (panel) panel.style.display = panel.style.display === 'none' ? '' : 'none';
    };
  }

  const exit = document.getElementById('btnDungeonExit');
  if (exit) exit.onclick = () => dispatch({ type: 'DUNGEON_EXIT' });
}

export function getDungeonStyles() {
  return `
    .dungeon-panel { position: relative; }
    .dungeon-desc { font-style: italic; color: #aaa; margin: 4px 0 8px; }
    .dungeon-entry-text { font-style: italic; color: #c8b98a; margin: 4px 0 8px; font-size: 0.95em; }
    .dungeon-ambient-text { color: #8a9cb8; font-size: 0.88em; margin: 2px 0 6px; }
    .dungeon-clear-text { color: #7acc7a; font-weight: bold; font-size: 0.95em; margin: 4px 0 8px; }
    .dungeon-floor-list { display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap; }
    .dungeon-floor-marker { font-size: 1.1em; cursor: default; }
    .dungeon-floor-marker.current { font-weight: bold; }
    .dungeon-progress-bar { width: 100%; height: 8px; background: #333; border-radius: 4px; margin: 6px 0 2px; overflow: hidden; }
    .dungeon-progress-fill { height: 100%; border-radius: 4px; transition: width 0.3s ease; }
    .dungeon-progress-text { font-size: 0.85em; color: #aaa; text-align: center; }
    .boss-btn { background: #8B0000 !important; border-color: #CD3700 !important; }
    .boss-btn:hover { background: #CD3700 !important; }
    .merchant-btn { background: #2D0A4E !important; border-color: #7B2FBE !important; }
    .merchant-btn:hover { background: #7B2FBE !important; }
    .dungeon-enter-btn { background: #2F4F4F !important; border-color: #5F9EA0 !important; margin-top: 4px; }
    .dungeon-enter-btn:hover { background: #5F9EA0 !important; }
  `;
}

export function shouldShowDungeonEntrance(state) {
  if (state.phase !== 'exploration') return false;
  if (!state.player || !canEnterDungeon(state.player.level)) return false;
  const roomId = getRoomIdFromWorld(state.world);
  return roomId === 'sw';
}

export function getFlavorText(floor, cleared) {
  return {
    entryText: floor.entryText || '',
    ambientMessages: floor.ambientMessages || [],
    clearText: floor.clearText || '',
  };
}

function getRoomIdFromWorld(world) {
  if (!world) return null;
  const ROOM_ID_MAP = [['nw', 'n', 'ne'], ['w', 'center', 'e'], ['sw', 's', 'se']];
  return ROOM_ID_MAP[world.roomRow]?.[world.roomCol] ?? null;
}
