/**
 * Dungeon System - Procedural dungeons with rooms, encounters, and loot
 */

export const DUNGEON_TYPES = {
  CAVE: { id: 'cave', name: 'Cave', icon: '🕳️', minRooms: 5, maxRooms: 10 },
  CRYPT: { id: 'crypt', name: 'Crypt', icon: '⚰️', minRooms: 6, maxRooms: 12 },
  CASTLE: { id: 'castle', name: 'Castle', icon: '🏰', minRooms: 8, maxRooms: 15 },
  FOREST: { id: 'forest', name: 'Enchanted Forest', icon: '🌲', minRooms: 7, maxRooms: 14 },
  VOLCANO: { id: 'volcano', name: 'Volcano', icon: '🌋', minRooms: 6, maxRooms: 11 }
};

export const ROOM_TYPES = {
  ENTRANCE: { id: 'entrance', name: 'Entrance', icon: '🚪', canHaveEnemies: false },
  CORRIDOR: { id: 'corridor', name: 'Corridor', icon: '📍', canHaveEnemies: true },
  CHAMBER: { id: 'chamber', name: 'Chamber', icon: '🏛️', canHaveEnemies: true },
  TREASURE: { id: 'treasure', name: 'Treasure Room', icon: '💎', canHaveEnemies: true },
  BOSS: { id: 'boss', name: 'Boss Chamber', icon: '👹', canHaveEnemies: true },
  SAFE: { id: 'safe', name: 'Safe Room', icon: '🛖', canHaveEnemies: false },
  TRAP: { id: 'trap', name: 'Trap Room', icon: '⚠️', canHaveEnemies: true }
};

export const DIFFICULTY_LEVELS = {
  EASY: { id: 'easy', name: 'Easy', enemyMultiplier: 0.5, lootMultiplier: 0.75, expMultiplier: 0.5 },
  NORMAL: { id: 'normal', name: 'Normal', enemyMultiplier: 1.0, lootMultiplier: 1.0, expMultiplier: 1.0 },
  HARD: { id: 'hard', name: 'Hard', enemyMultiplier: 1.5, lootMultiplier: 1.5, expMultiplier: 2.0 },
  NIGHTMARE: { id: 'nightmare', name: 'Nightmare', enemyMultiplier: 2.0, lootMultiplier: 2.0, expMultiplier: 3.0 }
};

function generateDungeonId() {
  return 'dungeon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function generateRoomId() {
  return 'room_' + Math.random().toString(36).substr(2, 9);
}

export function initDungeonState(state) {
  return {
    state: {
      ...state,
      dungeons: {
        activeDungeon: null,
        completedDungeons: [],
        stats: { totalCleared: 0, totalDeaths: 0, bossesKilled: 0 }
      }
    },
    success: true
  };
}

export function generateDungeon(dungeonType, difficulty, playerLevel = 1) {
  const type = DUNGEON_TYPES[dungeonType.toUpperCase()];
  const diff = DIFFICULTY_LEVELS[difficulty.toUpperCase()];
  if (!type || !diff) return { success: false, error: 'Invalid type or difficulty' };

  const roomCount = Math.floor(Math.random() * (type.maxRooms - type.minRooms + 1)) + type.minRooms;
  const rooms = [];

  // Entrance
  rooms.push({ id: generateRoomId(), type: 'entrance', name: 'Entrance', cleared: false, enemies: [], loot: [], connections: [1] });

  // Middle rooms
  for (let i = 1; i < roomCount - 1; i++) {
    const roomTypes = ['corridor', 'chamber', 'safe', 'trap'];
    if (i % 4 === 0) roomTypes.push('treasure');
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const roomInfo = ROOM_TYPES[roomType.toUpperCase()];
    
    const enemies = roomInfo.canHaveEnemies ? generateEnemies(playerLevel, diff.enemyMultiplier) : [];
    const loot = roomType === 'treasure' ? generateLoot(playerLevel, diff.lootMultiplier * 2) : generateLoot(playerLevel, diff.lootMultiplier * 0.5);

    rooms.push({
      id: generateRoomId(),
      type: roomType,
      name: roomInfo.name + ' ' + i,
      cleared: false,
      enemies,
      loot,
      connections: [i - 1, i + 1]
    });
  }

  // Boss room
  rooms.push({
    id: generateRoomId(),
    type: 'boss',
    name: 'Boss Chamber',
    cleared: false,
    enemies: generateBoss(playerLevel, diff.enemyMultiplier),
    loot: generateLoot(playerLevel, diff.lootMultiplier * 3),
    connections: [roomCount - 2]
  });

  const dungeon = {
    id: generateDungeonId(),
    type: type.id,
    typeName: type.name,
    typeIcon: type.icon,
    difficulty: diff.id,
    difficultyName: diff.name,
    playerLevel,
    rooms,
    currentRoom: 0,
    totalRooms: roomCount,
    clearedRooms: 0,
    startedAt: Date.now(),
    completedAt: null,
    expMultiplier: diff.expMultiplier
  };

  return { success: true, dungeon };
}

function generateEnemies(level, multiplier) {
  const count = Math.max(1, Math.floor((1 + Math.random() * 3) * multiplier));
  const enemies = [];
  for (let i = 0; i < count; i++) {
    const hp = Math.floor((50 + level * 10) * (0.8 + Math.random() * 0.4));
    enemies.push({
      id: 'enemy_' + Math.random().toString(36).substr(2, 6),
      name: 'Enemy ' + (i + 1),
      level: Math.max(1, level + Math.floor(Math.random() * 3) - 1),
      hp, maxHp: hp,
      attack: Math.floor((10 + level * 2) * (0.8 + Math.random() * 0.4)),
      defense: Math.floor((5 + level) * (0.8 + Math.random() * 0.4)),
      defeated: false
    });
  }
  return enemies;
}

function generateBoss(level, multiplier) {
  const hp = Math.floor((200 + level * 30) * multiplier);
  return [{
    id: 'boss_' + Math.random().toString(36).substr(2, 6),
    name: 'Dungeon Boss',
    level: level + 3,
    hp, maxHp: hp,
    attack: Math.floor((25 + level * 4) * multiplier),
    defense: Math.floor((15 + level * 2) * multiplier),
    defeated: false,
    isBoss: true
  }];
}

function generateLoot(level, multiplier) {
  const count = Math.floor(Math.random() * 3 * multiplier);
  const loot = [];
  for (let i = 0; i < count; i++) {
    loot.push({
      id: 'loot_' + Math.random().toString(36).substr(2, 6),
      name: 'Item ' + (i + 1),
      value: Math.floor((10 + level * 5) * multiplier * (0.5 + Math.random())),
      collected: false
    });
  }
  // Always add gold
  loot.push({
    id: 'gold_' + Math.random().toString(36).substr(2, 6),
    name: 'Gold',
    value: Math.floor((50 + level * 20) * multiplier * (0.5 + Math.random())),
    isGold: true,
    collected: false
  });
  return loot;
}

export function startDungeon(state, dungeon) {
  if (state.dungeons.activeDungeon) {
    return { success: false, error: 'Already in a dungeon' };
  }
  return {
    success: true,
    state: {
      ...state,
      dungeons: { ...state.dungeons, activeDungeon: dungeon }
    }
  };
}

export function getCurrentRoom(state) {
  if (!state.dungeons.activeDungeon) return { found: false };
  const dungeon = state.dungeons.activeDungeon;
  return { found: true, room: dungeon.rooms[dungeon.currentRoom], roomIndex: dungeon.currentRoom };
}

export function moveToRoom(state, roomIndex) {
  if (!state.dungeons.activeDungeon) return { success: false, error: 'Not in a dungeon' };
  const dungeon = state.dungeons.activeDungeon;
  const currentRoom = dungeon.rooms[dungeon.currentRoom];

  if (!currentRoom.connections.includes(roomIndex)) {
    return { success: false, error: 'Room not connected' };
  }

  if (roomIndex < 0 || roomIndex >= dungeon.rooms.length) {
    return { success: false, error: 'Invalid room' };
  }

  const newDungeon = { ...dungeon, currentRoom: roomIndex };
  return {
    success: true,
    state: {
      ...state,
      dungeons: { ...state.dungeons, activeDungeon: newDungeon }
    },
    newRoom: newDungeon.rooms[roomIndex]
  };
}

export function defeatEnemy(state, enemyId) {
  if (!state.dungeons.activeDungeon) return { success: false, error: 'Not in a dungeon' };
  const dungeon = state.dungeons.activeDungeon;
  const room = dungeon.rooms[dungeon.currentRoom];
  const enemyIndex = room.enemies.findIndex(e => e.id === enemyId);

  if (enemyIndex === -1) return { success: false, error: 'Enemy not found' };

  const updatedEnemies = [...room.enemies];
  updatedEnemies[enemyIndex] = { ...updatedEnemies[enemyIndex], defeated: true, hp: 0 };

  const updatedRoom = { ...room, enemies: updatedEnemies };
  const updatedRooms = [...dungeon.rooms];
  updatedRooms[dungeon.currentRoom] = updatedRoom;

  const allDefeated = updatedEnemies.every(e => e.defeated);
  if (allDefeated && !room.cleared) {
    updatedRoom.cleared = true;
  }

  const updatedDungeon = {
    ...dungeon,
    rooms: updatedRooms,
    clearedRooms: updatedRooms.filter(r => r.cleared).length
  };

  const isBoss = room.enemies[enemyIndex].isBoss;

  return {
    success: true,
    state: {
      ...state,
      dungeons: {
        ...state.dungeons,
        activeDungeon: updatedDungeon,
        stats: isBoss ? { ...state.dungeons.stats, bossesKilled: state.dungeons.stats.bossesKilled + 1 } : state.dungeons.stats
      }
    },
    roomCleared: allDefeated,
    wasBoss: isBoss
  };
}

export function collectLoot(state, lootId) {
  if (!state.dungeons.activeDungeon) return { success: false, error: 'Not in a dungeon' };
  const dungeon = state.dungeons.activeDungeon;
  const room = dungeon.rooms[dungeon.currentRoom];
  const lootIndex = room.loot.findIndex(l => l.id === lootId);

  if (lootIndex === -1) return { success: false, error: 'Loot not found' };
  if (room.loot[lootIndex].collected) return { success: false, error: 'Already collected' };

  const updatedLoot = [...room.loot];
  updatedLoot[lootIndex] = { ...updatedLoot[lootIndex], collected: true };

  const updatedRoom = { ...room, loot: updatedLoot };
  const updatedRooms = [...dungeon.rooms];
  updatedRooms[dungeon.currentRoom] = updatedRoom;

  const updatedDungeon = { ...dungeon, rooms: updatedRooms };

  return {
    success: true,
    state: {
      ...state,
      dungeons: { ...state.dungeons, activeDungeon: updatedDungeon }
    },
    collectedItem: room.loot[lootIndex]
  };
}

export function completeDungeon(state) {
  if (!state.dungeons.activeDungeon) return { success: false, error: 'Not in a dungeon' };
  const dungeon = state.dungeons.activeDungeon;
  const bossRoom = dungeon.rooms.find(r => r.type === 'boss');
  
  if (!bossRoom || !bossRoom.cleared) {
    return { success: false, error: 'Boss not defeated' };
  }

  const completedDungeon = { ...dungeon, completedAt: Date.now() };

  return {
    success: true,
    state: {
      ...state,
      dungeons: {
        ...state.dungeons,
        activeDungeon: null,
        completedDungeons: [...state.dungeons.completedDungeons, completedDungeon],
        stats: { ...state.dungeons.stats, totalCleared: state.dungeons.stats.totalCleared + 1 }
      }
    },
    completedDungeon
  };
}

export function abandonDungeon(state) {
  if (!state.dungeons.activeDungeon) return { success: false, error: 'Not in a dungeon' };
  
  return {
    success: true,
    state: {
      ...state,
      dungeons: {
        ...state.dungeons,
        activeDungeon: null,
        stats: { ...state.dungeons.stats, totalDeaths: state.dungeons.stats.totalDeaths + 1 }
      }
    }
  };
}

export function getDungeonProgress(state) {
  if (!state.dungeons.activeDungeon) return { inDungeon: false };
  const dungeon = state.dungeons.activeDungeon;
  return {
    inDungeon: true,
    dungeonName: dungeon.typeName,
    difficulty: dungeon.difficultyName,
    progress: Math.round((dungeon.clearedRooms / dungeon.totalRooms) * 100),
    clearedRooms: dungeon.clearedRooms,
    totalRooms: dungeon.totalRooms,
    currentRoom: dungeon.currentRoom
  };
}

export function getDungeonStats(state) {
  return state.dungeons.stats;
}

export function getAllDungeonTypes() {
  return Object.values(DUNGEON_TYPES);
}

export function getAllDifficulties() {
  return Object.values(DIFFICULTY_LEVELS);
}
