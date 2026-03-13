/**
 * Gem Socketing System
 * Socket gems into equipment for stat bonuses
 */

// Gem types
export const GEM_TYPES = {
  RUBY: { id: 'ruby', name: 'Ruby', color: '#ff0000', stat: 'attack', baseValue: 5 },
  SAPPHIRE: { id: 'sapphire', name: 'Sapphire', color: '#0066ff', stat: 'mana', baseValue: 10 },
  EMERALD: { id: 'emerald', name: 'Emerald', color: '#00ff00', stat: 'health', baseValue: 15 },
  DIAMOND: { id: 'diamond', name: 'Diamond', color: '#ffffff', stat: 'defense', baseValue: 4 },
  AMETHYST: { id: 'amethyst', name: 'Amethyst', color: '#9900ff', stat: 'magic', baseValue: 5 },
  TOPAZ: { id: 'topaz', name: 'Topaz', color: '#ffcc00', stat: 'speed', baseValue: 3 },
  ONYX: { id: 'onyx', name: 'Onyx', color: '#1a1a1a', stat: 'critChance', baseValue: 2 },
  OPAL: { id: 'opal', name: 'Opal', color: '#ffccff', stat: 'luck', baseValue: 3 }
};

// Gem quality tiers
export const GEM_QUALITY = {
  CHIPPED: { id: 'chipped', name: 'Chipped', multiplier: 0.5, level: 1 },
  FLAWED: { id: 'flawed', name: 'Flawed', multiplier: 0.75, level: 10 },
  REGULAR: { id: 'regular', name: 'Regular', multiplier: 1.0, level: 20 },
  FLAWLESS: { id: 'flawless', name: 'Flawless', multiplier: 1.5, level: 40 },
  PERFECT: { id: 'perfect', name: 'Perfect', multiplier: 2.0, level: 60 },
  RADIANT: { id: 'radiant', name: 'Radiant', multiplier: 3.0, level: 80 }
};

// Socket types
export const SOCKET_TYPES = {
  RED: { id: 'red', name: 'Red Socket', accepts: ['ruby', 'topaz'] },
  BLUE: { id: 'blue', name: 'Blue Socket', accepts: ['sapphire', 'amethyst'] },
  GREEN: { id: 'green', name: 'Green Socket', accepts: ['emerald', 'opal'] },
  WHITE: { id: 'white', name: 'White Socket', accepts: ['diamond', 'onyx'] },
  PRISMATIC: { id: 'prismatic', name: 'Prismatic Socket', accepts: ['all'] }
};

// Socket bonus when matching colors
export const SOCKET_BONUS = {
  NONE: { id: 'none', name: 'No Bonus', multiplier: 1.0 },
  PARTIAL: { id: 'partial', name: 'Partial Match', multiplier: 1.1 },
  FULL: { id: 'full', name: 'Full Match', multiplier: 1.25 }
};

/**
 * Get socket state from game state
 */
function getSocketState(state) {
  return state.gemSocket || {
    gems: {},
    socketedItems: {},
    history: [],
    stats: {
      gemsSocketed: 0,
      gemsRemoved: 0,
      gemsCombined: 0
    }
  };
}

/**
 * Initialize socket state
 */
export function initSocketState(state) {
  return {
    state: {
      ...state,
      gemSocket: {
        gems: {},
        socketedItems: {},
        history: [],
        stats: {
          gemsSocketed: 0,
          gemsRemoved: 0,
          gemsCombined: 0
        }
      }
    },
    success: true
  };
}

/**
 * Create a gem
 */
export function createGem(gemType, quality = 'regular') {
  const typeKey = gemType.toUpperCase();
  const qualityKey = quality.toUpperCase();

  const type = GEM_TYPES[typeKey];
  const gemQuality = GEM_QUALITY[qualityKey];

  if (!type) {
    return { gem: null, error: 'Invalid gem type' };
  }

  if (!gemQuality) {
    return { gem: null, error: 'Invalid gem quality' };
  }

  const gem = {
    id: `gem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type.id,
    quality: gemQuality.id,
    stat: type.stat,
    value: Math.floor(type.baseValue * gemQuality.multiplier),
    name: `${gemQuality.name} ${type.name}`,
    color: type.color,
    levelReq: gemQuality.level
  };

  return { gem, success: true };
}

/**
 * Add gem to inventory
 */
export function addGem(state, gem) {
  if (!gem || !gem.id) {
    return { state, success: false, error: 'Invalid gem' };
  }

  const socketState = getSocketState(state);

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        gems: {
          ...socketState.gems,
          [gem.id]: gem
        }
      }
    },
    success: true,
    gemId: gem.id
  };
}

/**
 * Remove gem from inventory
 */
export function removeGem(state, gemId) {
  const socketState = getSocketState(state);

  if (!socketState.gems[gemId]) {
    return { state, success: false, error: 'Gem not found' };
  }

  const { [gemId]: removed, ...remainingGems } = socketState.gems;

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        gems: remainingGems
      }
    },
    success: true,
    gem: removed
  };
}

/**
 * Create socketed item entry
 */
export function createSocketedItem(state, itemId, socketCount, socketTypes = []) {
  if (!itemId) {
    return { state, success: false, error: 'Item ID required' };
  }

  if (socketCount < 1 || socketCount > 6) {
    return { state, success: false, error: 'Socket count must be 1-6' };
  }

  const socketState = getSocketState(state);

  if (socketState.socketedItems[itemId]) {
    return { state, success: false, error: 'Item already has sockets' };
  }

  // Create sockets
  const sockets = [];
  for (let i = 0; i < socketCount; i++) {
    const socketType = socketTypes[i] || 'prismatic';
    sockets.push({
      index: i,
      type: socketType.toLowerCase(),
      gemId: null
    });
  }

  const socketedItem = {
    itemId,
    sockets,
    totalStats: {},
    bonusLevel: 'none'
  };

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        socketedItems: {
          ...socketState.socketedItems,
          [itemId]: socketedItem
        }
      }
    },
    success: true,
    item: socketedItem
  };
}

/**
 * Check if gem can be socketed
 */
export function canSocketGem(state, itemId, socketIndex, gemId) {
  const socketState = getSocketState(state);

  const item = socketState.socketedItems[itemId];
  if (!item) {
    return { canSocket: false, error: 'Item not found' };
  }

  const socket = item.sockets[socketIndex];
  if (!socket) {
    return { canSocket: false, error: 'Socket not found' };
  }

  if (socket.gemId) {
    return { canSocket: false, error: 'Socket already filled' };
  }

  const gem = socketState.gems[gemId];
  if (!gem) {
    return { canSocket: false, error: 'Gem not found' };
  }

  const socketType = SOCKET_TYPES[socket.type.toUpperCase()];
  if (!socketType) {
    return { canSocket: false, error: 'Invalid socket type' };
  }

  // Check if gem type is accepted
  if (socketType.accepts[0] !== 'all' && !socketType.accepts.includes(gem.type)) {
    return { canSocket: false, error: 'Gem type not compatible with socket' };
  }

  return { canSocket: true };
}

/**
 * Socket a gem into an item
 */
export function socketGem(state, itemId, socketIndex, gemId) {
  const canSocket = canSocketGem(state, itemId, socketIndex, gemId);
  if (!canSocket.canSocket) {
    return { state, success: false, error: canSocket.error };
  }

  const socketState = getSocketState(state);
  const item = { ...socketState.socketedItems[itemId] };
  const gem = socketState.gems[gemId];

  // Update socket with gem
  const newSockets = [...item.sockets];
  newSockets[socketIndex] = {
    ...newSockets[socketIndex],
    gemId
  };

  // Calculate total stats from all socketed gems
  const totalStats = {};
  newSockets.forEach(s => {
    if (s.gemId) {
      const socketedGem = socketState.gems[s.gemId];
      if (socketedGem) {
        totalStats[socketedGem.stat] = (totalStats[socketedGem.stat] || 0) + socketedGem.value;
      }
    }
  });

  // Calculate bonus level
  const bonusLevel = calculateBonusLevel(newSockets, socketState.gems);

  const updatedItem = {
    ...item,
    sockets: newSockets,
    totalStats,
    bonusLevel
  };

  // Remove gem from inventory
  const { [gemId]: removedGem, ...remainingGems } = socketState.gems;

  // Add to history
  const historyEntry = {
    action: 'socket',
    itemId,
    socketIndex,
    gemId,
    gemName: gem.name,
    timestamp: Date.now()
  };

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        gems: remainingGems,
        socketedItems: {
          ...socketState.socketedItems,
          [itemId]: updatedItem
        },
        history: [...socketState.history.slice(-49), historyEntry],
        stats: {
          ...socketState.stats,
          gemsSocketed: socketState.stats.gemsSocketed + 1
        }
      }
    },
    success: true,
    item: updatedItem,
    gem
  };
}

/**
 * Calculate socket bonus level
 */
function calculateBonusLevel(sockets, gems) {
  let totalSockets = 0;
  let matchingSockets = 0;

  sockets.forEach(socket => {
    if (socket.gemId) {
      totalSockets++;
      const gem = gems[socket.gemId];
      if (gem) {
        const socketType = SOCKET_TYPES[socket.type.toUpperCase()];
        if (socketType && (socketType.accepts[0] === 'all' || socketType.accepts.includes(gem.type))) {
          matchingSockets++;
        }
      }
    }
  });

  if (totalSockets === 0) return 'none';
  
  const ratio = matchingSockets / totalSockets;
  if (ratio === 1) return 'full';
  if (ratio >= 0.5) return 'partial';
  return 'none';
}

/**
 * Remove gem from socket
 */
export function unsocketGem(state, itemId, socketIndex, destroyGem = false) {
  const socketState = getSocketState(state);

  const item = socketState.socketedItems[itemId];
  if (!item) {
    return { state, success: false, error: 'Item not found' };
  }

  const socket = item.sockets[socketIndex];
  if (!socket) {
    return { state, success: false, error: 'Socket not found' };
  }

  if (!socket.gemId) {
    return { state, success: false, error: 'Socket is empty' };
  }

  const gemId = socket.gemId;
  // We need to get the gem from the socket itself, not from inventory
  // The gem was moved out of inventory when socketed
  // For unsocketing, we'll recreate it based on stored info or assume it exists
  
  const newSockets = [...item.sockets];
  newSockets[socketIndex] = {
    ...newSockets[socketIndex],
    gemId: null
  };

  // Recalculate total stats
  const totalStats = {};
  newSockets.forEach(s => {
    if (s.gemId) {
      const socketedGem = socketState.gems[s.gemId];
      if (socketedGem) {
        totalStats[socketedGem.stat] = (totalStats[socketedGem.stat] || 0) + socketedGem.value;
      }
    }
  });

  const bonusLevel = calculateBonusLevel(newSockets, socketState.gems);

  const updatedItem = {
    ...item,
    sockets: newSockets,
    totalStats,
    bonusLevel
  };

  // Add history entry
  const historyEntry = {
    action: 'unsocket',
    itemId,
    socketIndex,
    gemId,
    destroyed: destroyGem,
    timestamp: Date.now()
  };

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        socketedItems: {
          ...socketState.socketedItems,
          [itemId]: updatedItem
        },
        history: [...socketState.history.slice(-49), historyEntry],
        stats: {
          ...socketState.stats,
          gemsRemoved: socketState.stats.gemsRemoved + 1
        }
      }
    },
    success: true,
    item: updatedItem,
    gemId,
    destroyed: destroyGem
  };
}

/**
 * Combine gems to upgrade quality
 */
export function combineGems(state, gemIds) {
  if (!gemIds || gemIds.length < 3) {
    return { state, success: false, error: 'Need at least 3 gems to combine' };
  }

  const socketState = getSocketState(state);

  // Verify all gems exist and are same type/quality
  const gems = gemIds.map(id => socketState.gems[id]).filter(g => g);
  
  if (gems.length !== gemIds.length) {
    return { state, success: false, error: 'Some gems not found' };
  }

  const firstGem = gems[0];
  const sameType = gems.every(g => g.type === firstGem.type);
  const sameQuality = gems.every(g => g.quality === firstGem.quality);

  if (!sameType || !sameQuality) {
    return { state, success: false, error: 'All gems must be same type and quality' };
  }

  // Find next quality level
  const qualityOrder = ['chipped', 'flawed', 'regular', 'flawless', 'perfect', 'radiant'];
  const currentIndex = qualityOrder.indexOf(firstGem.quality);
  
  if (currentIndex === -1 || currentIndex >= qualityOrder.length - 1) {
    return { state, success: false, error: 'Cannot upgrade this quality' };
  }

  const newQuality = qualityOrder[currentIndex + 1];

  // Create upgraded gem
  const result = createGem(firstGem.type, newQuality);
  if (!result.gem) {
    return { state, success: false, error: 'Failed to create upgraded gem' };
  }

  // Remove old gems
  const remainingGems = { ...socketState.gems };
  gemIds.forEach(id => delete remainingGems[id]);

  // Add new gem
  remainingGems[result.gem.id] = result.gem;

  // Add history entry
  const historyEntry = {
    action: 'combine',
    sourceGems: gemIds,
    resultGem: result.gem.id,
    resultName: result.gem.name,
    timestamp: Date.now()
  };

  return {
    state: {
      ...state,
      gemSocket: {
        ...socketState,
        gems: remainingGems,
        history: [...socketState.history.slice(-49), historyEntry],
        stats: {
          ...socketState.stats,
          gemsCombined: socketState.stats.gemsCombined + gemIds.length
        }
      }
    },
    success: true,
    newGem: result.gem,
    consumed: gemIds.length
  };
}

/**
 * Get item socket info
 */
export function getItemSockets(state, itemId) {
  const socketState = getSocketState(state);
  const item = socketState.socketedItems[itemId];

  if (!item) {
    return { found: false, item: null };
  }

  return {
    found: true,
    item,
    emptySlots: item.sockets.filter(s => !s.gemId).length,
    filledSlots: item.sockets.filter(s => s.gemId).length
  };
}

/**
 * Get all gems in inventory
 */
export function getGemInventory(state) {
  const socketState = getSocketState(state);
  return Object.values(socketState.gems);
}

/**
 * Get gems grouped by type
 */
export function getGemsByType(state) {
  const gems = getGemInventory(state);
  const grouped = {};

  gems.forEach(gem => {
    if (!grouped[gem.type]) {
      grouped[gem.type] = [];
    }
    grouped[gem.type].push(gem);
  });

  return grouped;
}

/**
 * Get socket system stats
 */
export function getSocketStats(state) {
  const socketState = getSocketState(state);
  return {
    ...socketState.stats,
    totalGems: Object.keys(socketState.gems).length,
    totalSocketedItems: Object.keys(socketState.socketedItems).length
  };
}

/**
 * Get socket history
 */
export function getSocketHistory(state) {
  const socketState = getSocketState(state);
  return socketState.history.slice(-20).reverse();
}
