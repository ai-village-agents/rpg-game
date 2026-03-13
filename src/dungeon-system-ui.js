/**
 * Dungeon System UI
 */

import {
  DUNGEON_TYPES,
  ROOM_TYPES,
  DIFFICULTY_LEVELS,
  getCurrentRoom,
  getDungeonProgress,
  getDungeonStats,
  getAllDungeonTypes,
  getAllDifficulties
} from './dungeon-system.js';

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatNumber(num) { return num.toLocaleString(); }

export function renderDungeonSelector(playerLevel = 1) {
  const types = getAllDungeonTypes();
  const diffs = getAllDifficulties();

  const typeOptions = types.map(t => 
    '<option value="' + t.id + '">' + t.icon + ' ' + escapeHtml(t.name) + '</option>'
  ).join('');

  const diffOptions = diffs.map(d =>
    '<option value="' + d.id + '">' + escapeHtml(d.name) + '</option>'
  ).join('');

  return '<div class="dungeon-selector">' +
    '<h3>Select Dungeon</h3>' +
    '<div class="form-group"><label>Dungeon Type</label><select class="dungeon-type-select">' + typeOptions + '</select></div>' +
    '<div class="form-group"><label>Difficulty</label><select class="difficulty-select">' + diffOptions + '</select></div>' +
    '<div class="player-level">Your Level: ' + playerLevel + '</div>' +
    '<button class="btn start-dungeon" data-action="generate-dungeon">Enter Dungeon</button>' +
  '</div>';
}

export function renderDungeonMap(state) {
  if (!state.dungeons.activeDungeon) return '<div class="dungeon-map empty">Not in a dungeon</div>';
  const dungeon = state.dungeons.activeDungeon;

  const roomNodes = dungeon.rooms.map((room, idx) => {
    const roomType = ROOM_TYPES[room.type.toUpperCase()] || { icon: '?' };
    const isCurrent = idx === dungeon.currentRoom;
    const classes = 'room-node' + (isCurrent ? ' current' : '') + (room.cleared ? ' cleared' : '');
    return '<div class="' + classes + '" data-room="' + idx + '">' +
      '<span class="room-icon">' + roomType.icon + '</span>' +
      '<span class="room-name">' + escapeHtml(room.name) + '</span>' +
    '</div>';
  }).join('');

  return '<div class="dungeon-map">' +
    '<div class="map-header">' + dungeon.typeIcon + ' ' + escapeHtml(dungeon.typeName) + ' (' + escapeHtml(dungeon.difficultyName) + ')</div>' +
    '<div class="room-grid">' + roomNodes + '</div>' +
  '</div>';
}

export function renderCurrentRoom(state) {
  const result = getCurrentRoom(state);
  if (!result.found) return '<div class="current-room empty">Not in a dungeon</div>';
  const room = result.room;
  const roomType = ROOM_TYPES[room.type.toUpperCase()] || { icon: '?', name: 'Unknown' };

  const enemyList = room.enemies.length > 0 
    ? room.enemies.map(e => '<div class="enemy-row' + (e.defeated ? ' defeated' : '') + '">' +
        '<span class="enemy-name">' + escapeHtml(e.name) + (e.isBoss ? ' (BOSS)' : '') + '</span>' +
        '<span class="enemy-hp">' + e.hp + '/' + e.maxHp + ' HP</span>' +
        (e.defeated ? '' : '<button class="btn attack" data-action="attack" data-enemy-id="' + escapeHtml(e.id) + '">Attack</button>') +
      '</div>').join('')
    : '<p>No enemies</p>';

  const lootList = room.loot.length > 0
    ? room.loot.map(l => '<div class="loot-row' + (l.collected ? ' collected' : '') + '">' +
        '<span class="loot-name">' + escapeHtml(l.name) + '</span>' +
        '<span class="loot-value">' + formatNumber(l.value) + (l.isGold ? ' gold' : '') + '</span>' +
        (l.collected ? '<span class="collected-badge">Collected</span>' : '<button class="btn collect" data-action="collect" data-loot-id="' + escapeHtml(l.id) + '">Collect</button>') +
      '</div>').join('')
    : '<p>No loot</p>';

  const connections = room.connections.map(idx => {
    const targetRoom = state.dungeons.activeDungeon.rooms[idx];
    return '<button class="btn move" data-action="move" data-room="' + idx + '">' +
      'Go to ' + escapeHtml(targetRoom.name) + '</button>';
  }).join('');

  return '<div class="current-room">' +
    '<div class="room-header">' +
      '<span class="room-icon large">' + roomType.icon + '</span>' +
      '<h2 class="room-name">' + escapeHtml(room.name) + '</h2>' +
      (room.cleared ? '<span class="cleared-badge">Cleared</span>' : '') +
    '</div>' +
    '<div class="room-content">' +
      '<div class="enemies-section"><h3>Enemies</h3>' + enemyList + '</div>' +
      '<div class="loot-section"><h3>Loot</h3>' + lootList + '</div>' +
    '</div>' +
    '<div class="room-navigation"><h3>Exits</h3>' + connections + '</div>' +
  '</div>';
}

export function renderDungeonProgress(state) {
  const progress = getDungeonProgress(state);
  if (!progress.inDungeon) return '<div class="dungeon-progress empty">Not in a dungeon</div>';

  return '<div class="dungeon-progress">' +
    '<div class="progress-header">' + escapeHtml(progress.dungeonName) + ' - ' + escapeHtml(progress.difficulty) + '</div>' +
    '<div class="progress-bar"><div class="progress-fill" style="width: ' + progress.progress + '%"></div></div>' +
    '<div class="progress-text">' + progress.clearedRooms + '/' + progress.totalRooms + ' rooms cleared (' + progress.progress + '%)</div>' +
  '</div>';
}

export function renderDungeonStats(state) {
  const stats = getDungeonStats(state);
  return '<div class="dungeon-stats">' +
    '<h3>Dungeon Statistics</h3>' +
    '<div class="stat-row"><span>Dungeons Cleared</span><span>' + stats.totalCleared + '</span></div>' +
    '<div class="stat-row"><span>Deaths</span><span>' + stats.totalDeaths + '</span></div>' +
    '<div class="stat-row"><span>Bosses Killed</span><span>' + stats.bossesKilled + '</span></div>' +
  '</div>';
}

export function renderDungeonActions(state) {
  if (!state.dungeons.activeDungeon) return '';
  const dungeon = state.dungeons.activeDungeon;
  const bossRoom = dungeon.rooms.find(r => r.type === 'boss');
  const canComplete = bossRoom && bossRoom.cleared;

  return '<div class="dungeon-actions">' +
    (canComplete ? '<button class="btn complete" data-action="complete-dungeon">Complete Dungeon</button>' : '') +
    '<button class="btn abandon danger" data-action="abandon-dungeon">Abandon Dungeon</button>' +
  '</div>';
}

export function renderDungeonPage(state, playerLevel = 1) {
  if (!state.dungeons.activeDungeon) {
    return '<div class="dungeon-page">' +
      '<header class="page-header"><h1>Dungeons</h1></header>' +
      '<div class="page-content">' +
        renderDungeonSelector(playerLevel) +
        renderDungeonStats(state) +
      '</div>' +
    '</div>';
  }

  return '<div class="dungeon-page in-dungeon">' +
    '<header class="page-header"><h1>Dungeon Run</h1>' + renderDungeonProgress(state) + '</header>' +
    '<div class="page-content">' +
      '<div class="main-area">' +
        renderCurrentRoom(state) +
      '</div>' +
      '<aside class="sidebar">' +
        renderDungeonMap(state) +
        renderDungeonActions(state) +
      '</aside>' +
    '</div>' +
  '</div>';
}

export function renderDungeonComplete(completedDungeon) {
  const duration = Math.round((completedDungeon.completedAt - completedDungeon.startedAt) / 1000 / 60);
  return '<div class="dungeon-complete">' +
    '<h2>Dungeon Complete!</h2>' +
    '<div class="complete-info">' +
      '<p>' + completedDungeon.typeIcon + ' ' + escapeHtml(completedDungeon.typeName) + '</p>' +
      '<p>Difficulty: ' + escapeHtml(completedDungeon.difficultyName) + '</p>' +
      '<p>Rooms Cleared: ' + completedDungeon.clearedRooms + '/' + completedDungeon.totalRooms + '</p>' +
      '<p>Time: ' + duration + ' minutes</p>' +
    '</div>' +
    '<button class="btn return" data-action="return-to-town">Return to Town</button>' +
  '</div>';
}
