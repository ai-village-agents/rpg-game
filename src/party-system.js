/**
 * Party Formation System
 * Create parties, assign roles, and manage compositions
 */

// Party roles
export const PARTY_ROLES = {
  TANK: { name: 'Tank', icon: '🛡️', description: 'Absorbs damage and protects allies' },
  HEALER: { name: 'Healer', icon: '💚', description: 'Restores health and removes debuffs' },
  DPS: { name: 'DPS', icon: '⚔️', description: 'Deals high damage to enemies' },
  SUPPORT: { name: 'Support', icon: '✨', description: 'Buffs allies and debuffs enemies' },
  FLEX: { name: 'Flex', icon: '🔄', description: 'Adapts to party needs' }
};

// Party formations
export const FORMATIONS = {
  STANDARD: {
    name: 'Standard',
    positions: [
      { row: 0, col: 1, role: 'TANK' },
      { row: 1, col: 0, role: 'DPS' },
      { row: 1, col: 2, role: 'DPS' },
      { row: 2, col: 1, role: 'HEALER' }
    ],
    bonuses: { defense: 0.05, attack: 0.05 }
  },
  AGGRESSIVE: {
    name: 'Aggressive',
    positions: [
      { row: 0, col: 0, role: 'DPS' },
      { row: 0, col: 2, role: 'DPS' },
      { row: 1, col: 1, role: 'DPS' },
      { row: 2, col: 1, role: 'SUPPORT' }
    ],
    bonuses: { attack: 0.15, defense: -0.10 }
  },
  DEFENSIVE: {
    name: 'Defensive',
    positions: [
      { row: 0, col: 0, role: 'TANK' },
      { row: 0, col: 2, role: 'TANK' },
      { row: 1, col: 1, role: 'HEALER' },
      { row: 2, col: 1, role: 'HEALER' }
    ],
    bonuses: { defense: 0.20, attack: -0.10 }
  },
  BALANCED: {
    name: 'Balanced',
    positions: [
      { row: 0, col: 1, role: 'TANK' },
      { row: 1, col: 0, role: 'DPS' },
      { row: 1, col: 2, role: 'SUPPORT' },
      { row: 2, col: 1, role: 'HEALER' }
    ],
    bonuses: { defense: 0.08, attack: 0.08, healing: 0.08 }
  },
  FLANKING: {
    name: 'Flanking',
    positions: [
      { row: 0, col: 0, role: 'DPS' },
      { row: 0, col: 2, role: 'DPS' },
      { row: 1, col: 1, role: 'TANK' },
      { row: 2, col: 1, role: 'HEALER' }
    ],
    bonuses: { critChance: 0.10, attack: 0.05 }
  },
  SUPPORT_HEAVY: {
    name: 'Support Heavy',
    positions: [
      { row: 0, col: 1, role: 'TANK' },
      { row: 1, col: 0, role: 'SUPPORT' },
      { row: 1, col: 2, role: 'SUPPORT' },
      { row: 2, col: 1, role: 'HEALER' }
    ],
    bonuses: { healing: 0.15, buffDuration: 0.20 }
  }
};

// Party synergy types
export const SYNERGIES = {
  ELEMENTAL_HARMONY: {
    name: 'Elemental Harmony',
    description: 'All elements represented',
    bonus: { magicDamage: 0.15 }
  },
  CLASS_DIVERSITY: {
    name: 'Class Diversity',
    description: 'All different classes',
    bonus: { xpGain: 0.10 }
  },
  SAME_ELEMENT: {
    name: 'Elemental Focus',
    description: 'All same element',
    bonus: { elementalDamage: 0.25 }
  },
  FULL_PARTY: {
    name: 'Full Party',
    description: 'Maximum party size',
    bonus: { allStats: 0.05 }
  }
};

// Create initial party state
export function createPartyState(maxSize = 4) {
  return {
    members: [],
    maxSize,
    formation: 'STANDARD',
    leader: null,
    activeSynergies: [],
    partyBuffs: [],
    settings: {
      autoLoot: 'freeForAll',
      xpShare: 'equal',
      itemPriority: 'need'
    },
    stats: {
      battlesWon: 0,
      battlesLost: 0,
      totalDamageDealt: 0,
      totalHealing: 0
    },
    createdAt: Date.now()
  };
}

// Create a party member
export function createPartyMember(id, name, classType, level, stats = {}) {
  return {
    id,
    name,
    classType,
    level,
    role: null,
    position: null,
    stats: {
      hp: stats.hp || 100,
      maxHp: stats.maxHp || 100,
      mp: stats.mp || 50,
      maxMp: stats.maxMp || 50,
      attack: stats.attack || 10,
      defense: stats.defense || 10,
      speed: stats.speed || 10,
      ...stats
    },
    element: stats.element || null,
    joinedAt: Date.now()
  };
}

// Add member to party
export function addPartyMember(state, member) {
  if (!member || !member.id) {
    return { success: false, error: 'Invalid member' };
  }

  if (state.members.length >= state.maxSize) {
    return { success: false, error: 'Party is full' };
  }

  if (state.members.some(m => m.id === member.id)) {
    return { success: false, error: 'Member already in party' };
  }

  const newMembers = [...state.members, { ...member, joinedAt: Date.now() }];
  const newLeader = state.leader || member.id;

  // Recalculate synergies
  const synergies = calculateSynergies({ ...state, members: newMembers });

  return {
    success: true,
    state: {
      ...state,
      members: newMembers,
      leader: newLeader,
      activeSynergies: synergies
    }
  };
}

// Remove member from party
export function removePartyMember(state, memberId) {
  const memberIndex = state.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return { success: false, error: 'Member not in party' };
  }

  const newMembers = state.members.filter(m => m.id !== memberId);

  // Update leader if necessary
  let newLeader = state.leader;
  if (state.leader === memberId) {
    newLeader = newMembers.length > 0 ? newMembers[0].id : null;
  }

  const synergies = calculateSynergies({ ...state, members: newMembers });

  return {
    success: true,
    removedMember: state.members[memberIndex],
    state: {
      ...state,
      members: newMembers,
      leader: newLeader,
      activeSynergies: synergies
    }
  };
}

// Set party leader
export function setPartyLeader(state, memberId) {
  const member = state.members.find(m => m.id === memberId);
  if (!member) {
    return { success: false, error: 'Member not in party' };
  }

  return {
    success: true,
    state: {
      ...state,
      leader: memberId
    }
  };
}

// Assign role to member
export function assignRole(state, memberId, role) {
  if (!PARTY_ROLES[role?.toUpperCase()]) {
    return { success: false, error: 'Invalid role' };
  }

  const memberIndex = state.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return { success: false, error: 'Member not in party' };
  }

  const newMembers = [...state.members];
  newMembers[memberIndex] = {
    ...newMembers[memberIndex],
    role: role.toUpperCase()
  };

  return {
    success: true,
    state: {
      ...state,
      members: newMembers
    }
  };
}

// Set formation
export function setFormation(state, formation) {
  if (!FORMATIONS[formation?.toUpperCase()]) {
    return { success: false, error: 'Invalid formation' };
  }

  return {
    success: true,
    state: {
      ...state,
      formation: formation.toUpperCase()
    }
  };
}

// Get formation bonuses
export function getFormationBonuses(state) {
  const formation = FORMATIONS[state.formation];
  if (!formation) return {};

  return { ...formation.bonuses };
}

// Assign position to member
export function assignPosition(state, memberId, row, col) {
  const memberIndex = state.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return { success: false, error: 'Member not in party' };
  }

  // Check if position is taken
  const positionTaken = state.members.some(
    (m, i) => i !== memberIndex && m.position?.row === row && m.position?.col === col
  );

  if (positionTaken) {
    return { success: false, error: 'Position already occupied' };
  }

  const newMembers = [...state.members];
  newMembers[memberIndex] = {
    ...newMembers[memberIndex],
    position: { row, col }
  };

  return {
    success: true,
    state: {
      ...state,
      members: newMembers
    }
  };
}

// Swap positions between two members
export function swapPositions(state, memberId1, memberId2) {
  const index1 = state.members.findIndex(m => m.id === memberId1);
  const index2 = state.members.findIndex(m => m.id === memberId2);

  if (index1 === -1 || index2 === -1) {
    return { success: false, error: 'Member not in party' };
  }

  const newMembers = [...state.members];
  const pos1 = newMembers[index1].position;
  const pos2 = newMembers[index2].position;

  newMembers[index1] = { ...newMembers[index1], position: pos2 };
  newMembers[index2] = { ...newMembers[index2], position: pos1 };

  return {
    success: true,
    state: {
      ...state,
      members: newMembers
    }
  };
}

// Calculate party synergies
export function calculateSynergies(state) {
  const synergies = [];

  if (state.members.length === state.maxSize) {
    synergies.push('FULL_PARTY');
  }

  // Check class diversity
  const classes = new Set(state.members.map(m => m.classType));
  if (classes.size === state.members.length && state.members.length > 1) {
    synergies.push('CLASS_DIVERSITY');
  }

  // Check element synergies
  const elements = state.members.map(m => m.element).filter(Boolean);
  const uniqueElements = new Set(elements);

  if (uniqueElements.size >= 4) {
    synergies.push('ELEMENTAL_HARMONY');
  } else if (uniqueElements.size === 1 && elements.length >= 2) {
    synergies.push('SAME_ELEMENT');
  }

  return synergies;
}

// Get synergy bonuses
export function getSynergyBonuses(state) {
  const bonuses = {};

  for (const synergyId of state.activeSynergies) {
    const synergy = SYNERGIES[synergyId];
    if (synergy) {
      for (const [stat, value] of Object.entries(synergy.bonus)) {
        bonuses[stat] = (bonuses[stat] || 0) + value;
      }
    }
  }

  return bonuses;
}

// Get total party stats
export function getPartyStats(state) {
  const totals = {
    totalHp: 0,
    totalMaxHp: 0,
    avgLevel: 0,
    avgAttack: 0,
    avgDefense: 0,
    memberCount: state.members.length
  };

  if (state.members.length === 0) return totals;

  for (const member of state.members) {
    totals.totalHp += member.stats.hp || 0;
    totals.totalMaxHp += member.stats.maxHp || 0;
    totals.avgLevel += member.level || 1;
    totals.avgAttack += member.stats.attack || 0;
    totals.avgDefense += member.stats.defense || 0;
  }

  totals.avgLevel = Math.round(totals.avgLevel / state.members.length);
  totals.avgAttack = Math.round(totals.avgAttack / state.members.length);
  totals.avgDefense = Math.round(totals.avgDefense / state.members.length);

  return totals;
}

// Update member stats
export function updateMemberStats(state, memberId, statChanges) {
  const memberIndex = state.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) {
    return { success: false, error: 'Member not in party' };
  }

  const member = state.members[memberIndex];
  const newStats = { ...member.stats };

  for (const [stat, change] of Object.entries(statChanges)) {
    if (typeof newStats[stat] === 'number') {
      newStats[stat] = Math.max(0, newStats[stat] + change);

      // Cap current values at max
      if (stat === 'hp' && newStats.maxHp) {
        newStats.hp = Math.min(newStats.hp, newStats.maxHp);
      }
      if (stat === 'mp' && newStats.maxMp) {
        newStats.mp = Math.min(newStats.mp, newStats.maxMp);
      }
    }
  }

  const newMembers = [...state.members];
  newMembers[memberIndex] = { ...member, stats: newStats };

  return {
    success: true,
    state: {
      ...state,
      members: newMembers
    }
  };
}

// Heal entire party
export function healParty(state, amount) {
  const newMembers = state.members.map(member => ({
    ...member,
    stats: {
      ...member.stats,
      hp: Math.min(member.stats.hp + amount, member.stats.maxHp)
    }
  }));

  return {
    ...state,
    members: newMembers
  };
}

// Apply party buff
export function applyPartyBuff(state, buff) {
  if (!buff || !buff.id || !buff.name) {
    return { success: false, error: 'Invalid buff' };
  }

  if (state.partyBuffs.some(b => b.id === buff.id)) {
    return { success: false, error: 'Buff already active' };
  }

  const newBuff = {
    ...buff,
    appliedAt: Date.now(),
    expiresAt: Date.now() + (buff.duration || 60000)
  };

  return {
    success: true,
    state: {
      ...state,
      partyBuffs: [...state.partyBuffs, newBuff]
    }
  };
}

// Remove party buff
export function removePartyBuff(state, buffId) {
  const buffExists = state.partyBuffs.some(b => b.id === buffId);
  if (!buffExists) {
    return { success: false, error: 'Buff not found' };
  }

  return {
    success: true,
    state: {
      ...state,
      partyBuffs: state.partyBuffs.filter(b => b.id !== buffId)
    }
  };
}

// Clean expired buffs
export function cleanExpiredBuffs(state) {
  const now = Date.now();
  const activeBuffs = state.partyBuffs.filter(b => b.expiresAt > now);

  if (activeBuffs.length === state.partyBuffs.length) {
    return { changed: false, state };
  }

  return {
    changed: true,
    expiredCount: state.partyBuffs.length - activeBuffs.length,
    state: {
      ...state,
      partyBuffs: activeBuffs
    }
  };
}

// Get party buffs
export function getPartyBuffs(state) {
  const now = Date.now();
  return state.partyBuffs
    .filter(b => b.expiresAt > now)
    .map(b => ({
      ...b,
      remainingTime: b.expiresAt - now
    }));
}

// Update party settings
export function updatePartySettings(state, settings) {
  return {
    ...state,
    settings: {
      ...state.settings,
      ...settings
    }
  };
}

// Get party settings
export function getPartySettings(state) {
  return { ...state.settings };
}

// Record battle result
export function recordBattleResult(state, won, damageDealt = 0, healingDone = 0) {
  return {
    ...state,
    stats: {
      ...state.stats,
      battlesWon: state.stats.battlesWon + (won ? 1 : 0),
      battlesLost: state.stats.battlesLost + (won ? 0 : 1),
      totalDamageDealt: state.stats.totalDamageDealt + damageDealt,
      totalHealing: state.stats.totalHealing + healingDone
    }
  };
}

// Get member by role
export function getMembersByRole(state, role) {
  const roleKey = role?.toUpperCase();
  return state.members.filter(m => m.role === roleKey);
}

// Check if party has role
export function hasRole(state, role) {
  return getMembersByRole(state, role).length > 0;
}

// Check if party is ready for combat
export function isPartyReady(state) {
  if (state.members.length === 0) {
    return { ready: false, reason: 'Party is empty' };
  }

  // Check for dead members
  const deadMembers = state.members.filter(m => m.stats.hp <= 0);
  if (deadMembers.length === state.members.length) {
    return { ready: false, reason: 'All party members are down' };
  }

  // Check for healer (recommended)
  const hasHealer = hasRole(state, 'HEALER');

  return {
    ready: true,
    hasHealer,
    aliveMemberCount: state.members.length - deadMembers.length,
    warnings: hasHealer ? [] : ['No healer in party']
  };
}

// Get party member by ID
export function getPartyMember(state, memberId) {
  return state.members.find(m => m.id === memberId) || null;
}

// Get party leader
export function getPartyLeader(state) {
  if (!state.leader) return null;
  return getPartyMember(state, state.leader);
}

// Disband party
export function disbandParty(state) {
  return {
    members: state.members,
    state: createPartyState(state.maxSize)
  };
}

// Get party summary
export function getPartySummary(state) {
  const stats = getPartyStats(state);
  const formationBonuses = getFormationBonuses(state);
  const synergyBonuses = getSynergyBonuses(state);
  const ready = isPartyReady(state);

  return {
    memberCount: state.members.length,
    maxSize: state.maxSize,
    formation: state.formation,
    formationName: FORMATIONS[state.formation]?.name || 'Unknown',
    leader: state.leader,
    activeSynergies: state.activeSynergies.map(s => SYNERGIES[s]?.name || s),
    stats,
    formationBonuses,
    synergyBonuses,
    isReady: ready.ready,
    readyStatus: ready
  };
}

// Auto-assign roles based on class
export function autoAssignRoles(state, classRoleMap = {}) {
  const defaultMap = {
    warrior: 'TANK',
    knight: 'TANK',
    paladin: 'TANK',
    priest: 'HEALER',
    cleric: 'HEALER',
    mage: 'DPS',
    wizard: 'DPS',
    rogue: 'DPS',
    archer: 'DPS',
    bard: 'SUPPORT',
    enchanter: 'SUPPORT'
  };

  const roleMap = { ...defaultMap, ...classRoleMap };

  let newState = { ...state };

  for (const member of state.members) {
    const classLower = member.classType?.toLowerCase();
    const suggestedRole = roleMap[classLower] || 'FLEX';

    const result = assignRole(newState, member.id, suggestedRole);
    if (result.success) {
      newState = result.state;
    }
  }

  return newState;
}

// Get role info
export function getRoleInfo(role) {
  return PARTY_ROLES[role?.toUpperCase()] || null;
}

// Get formation info
export function getFormationInfo(formation) {
  return FORMATIONS[formation?.toUpperCase()] || null;
}
