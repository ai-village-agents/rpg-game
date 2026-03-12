import { DUNGEON_FLOORS } from './dungeon-floors.js';

export const FLOOR_THEME_ICONS = {
  cavern: '🪨',
  goblin_stronghold: '⚔️',
  crypt: '💀',
  frozen_depths: '❄️',
  ruins: '🏚️',
  inferno: '🔥',
  abyss: '🌀',
  twilight: '🌙',
  arcane: '🔮',
  void: '🌑',
  celestial: '⭐',
  oblivion: '💫',
  default: '🗺️',
};

export const FLOOR_STATUS = {
  LOCKED: 'locked',
  UNVISITED: 'unvisited',
  CURRENT: 'current',
  CLEARED: 'cleared',
};

export const BOSS_FLOORS = DUNGEON_FLOORS.filter((floor) => floor.bossFloor).map((floor) => floor.id);

export function getFloorStatus(dungeonState, floorId) {
  if (dungeonState.floorsCleared.includes(floorId)) {
    return FLOOR_STATUS.CLEARED;
  }

  if (floorId === dungeonState.currentFloor) {
    return FLOOR_STATUS.CURRENT;
  }

  if (floorId <= dungeonState.deepestFloor) {
    return FLOOR_STATUS.UNVISITED;
  }

  return FLOOR_STATUS.LOCKED;
}

export function renderDungeonMapPanel(state) {
  const hasDungeonState = state?.dungeonState && state?.dungeonState?.inDungeon;
  const dungeonState = hasDungeonState
    ? state.dungeonState
    : {
        currentFloor: 1,
        floorsCleared: [],
        deepestFloor: 0,
      };

  const floorsCleared = dungeonState.floorsCleared.length;

  const floorRows = DUNGEON_FLOORS.map((floor, index) => {
    const status = getFloorStatus(dungeonState, floor.id);
    const themeIcon = FLOOR_THEME_ICONS[floor.theme] || FLOOR_THEME_ICONS.default;

    const statusIconByState = {
      [FLOOR_STATUS.LOCKED]: '🔒',
      [FLOOR_STATUS.CURRENT]: '👉',
      [FLOOR_STATUS.CLEARED]: '✅',
      [FLOOR_STATUS.UNVISITED]: '⬜',
    };

    const statusIcon = statusIconByState[status] || statusIconByState[FLOOR_STATUS.UNVISITED];
    const bossBadge = floor.bossFloor
      ? '<span class="dungeon-map-boss-badge">👑 BOSS</span>'
      : '';

    const floorRow = [
      `<div class='dungeon-map-floor dungeon-map-floor--${status}' data-floor-id='${floor.id}'>`,
      `  <span class='dungeon-map-floor-num'>${floor.id}</span>`,
      `  <span class='dungeon-map-theme-icon'>${themeIcon}</span>`,
      `  <span class='dungeon-map-floor-name'>${floor.name}</span>`,
      `  ${bossBadge}`,
      `  <span class='dungeon-map-status-icon'>${statusIcon}</span>`,
      `</div>`,
    ].join('\n');

    const connector = index < DUNGEON_FLOORS.length - 1
      ? "<div class='dungeon-map-connector'>│</div>"
      : '';

    return `${floorRow}\n${connector}`.trim();
  });

  return [
    "<div class='card dungeon-map-panel'>",
    '  <h2>🗺️ Dungeon Map</h2>',
    `  <p class='dungeon-map-progress'>${floorsCleared} / ${DUNGEON_FLOORS.length} floors cleared</p>`,
    "  <div class='dungeon-map-floors'>",
    floorRows.map((row) => `    ${row.replace(/\n/g, '\n    ')}`).join('\n'),
    '  </div>',
    '</div>',
  ].join('\n');
}

export function getDungeonMapSummary(dungeonState) {
  const floorsCleared = dungeonState.floorsCleared.length;
  const bossesDefeated = dungeonState.floorsCleared.filter((floorId) => BOSS_FLOORS.includes(floorId)).length;

  return {
    totalFloors: DUNGEON_FLOORS.length,
    floorsCleared,
    bossesDefeated,
    deepestFloor: dungeonState.deepestFloor,
    percentComplete: Math.round((floorsCleared / DUNGEON_FLOORS.length) * 100),
  };
}
