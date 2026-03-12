/**
 * Party Management System
 * Manages party composition, formations, and party-wide mechanics
 */

/**
 * Party member roles
 */
export const PARTY_ROLES = {
  TANK: 'tank',
  DPS: 'dps',
  HEALER: 'healer',
  SUPPORT: 'support',
};

/**
 * Formation positions
 */
export const FORMATION = {
  FRONT: 'front',
  BACK: 'back',
};

/**
 * Member recruitment sources
 */
export const RECRUIT_SOURCE = {
  STORY: 'story',
  QUEST: 'quest',
  TAVERN: 'tavern',
  EVENT: 'event',
};

/**
 * Party member definitions (recruitable characters)
 */
export const PARTY_MEMBERS = {
  'elena-knight': {
    id: 'elena-knight',
    name: 'Elena',
    title: 'Knight Captain',
    portrait: '\uD83D\uDC82\u200D\u2640\uFE0F',
    role: PARTY_ROLES.TANK,
    defaultPosition: FORMATION.FRONT,
    baseStats: { hp: 150, attack: 12, defense: 18, speed: 8 },
    abilities: ['shield-wall', 'taunt', 'counter'],
    description: 'A stalwart knight who protects allies with her shield.',
    recruitSource: RECRUIT_SOURCE.STORY,
    recruitQuestId: 'village-defense',
  },
  'mira-mage': {
    id: 'mira-mage',
    name: 'Mira',
    title: 'Fire Mage',
    portrait: '\uD83E\uDDD9\u200D\u2640\uFE0F',
    role: PARTY_ROLES.DPS,
    defaultPosition: FORMATION.BACK,
    baseStats: { hp: 80, attack: 20, defense: 6, speed: 12 },
    abilities: ['fireball', 'inferno', 'flame-shield'],
    description: 'A powerful mage who commands devastating fire magic.',
    recruitSource: RECRUIT_SOURCE.QUEST,
    recruitQuestId: 'dark-forest',
  },
  'felix-healer': {
    id: 'felix-healer',
    name: 'Felix',
    title: 'Priest',
    portrait: '\uD83E\uDDD1\u200D\u2695\uFE0F',
    role: PARTY_ROLES.HEALER,
    defaultPosition: FORMATION.BACK,
    baseStats: { hp: 90, attack: 8, defense: 10, speed: 10 },
    abilities: ['heal', 'bless', 'purify'],
    description: 'A devoted priest who heals wounds and purifies ailments.',
    recruitSource: RECRUIT_SOURCE.STORY,
    recruitQuestId: 'awakening',
  },
  'shadow-rogue': {
    id: 'shadow-rogue',
    name: 'Shadow',
    title: 'Assassin',
    portrait: '\uD83E\uDD77',
    role: PARTY_ROLES.DPS,
    defaultPosition: FORMATION.FRONT,
    baseStats: { hp: 85, attack: 22, defense: 8, speed: 18 },
    abilities: ['backstab', 'poison-blade', 'vanish'],
    description: 'A silent assassin who strikes from the shadows.',
    recruitSource: RECRUIT_SOURCE.TAVERN,
    recruitQuestId: null,
  },
  'gaia-druid': {
    id: 'gaia-druid',
    name: 'Gaia',
    title: 'Druid',
    portrait: '\uD83E\uDDD1\u200D\uD83C\uDF3E',
    role: PARTY_ROLES.SUPPORT,
    defaultPosition: FORMATION.BACK,
    baseStats: { hp: 100, attack: 10, defense: 12, speed: 10 },
    abilities: ['nature-heal', 'thorns', 'entangle'],
    description: 'A druid who channels the power of nature.',
    recruitSource: RECRUIT_SOURCE.EVENT,
    recruitQuestId: 'herb-gathering',
  },
  'rex-berserker': {
    id: 'rex-berserker',
    name: 'Rex',
    title: 'Berserker',
    portrait: '\uD83E\uDDBE',
    role: PARTY_ROLES.DPS,
    defaultPosition: FORMATION.FRONT,
    baseStats: { hp: 130, attack: 25, defense: 5, speed: 14 },
    abilities: ['berserk-rage', 'wild-swing', 'blood-fury'],
    description: 'A ferocious berserker who sacrifices defense for power.',
    recruitSource: RECRUIT_SOURCE.TAVERN,
    recruitQuestId: null,
  },
};

/**
 * Max party size (including player)
 */
export const MAX_PARTY_SIZE = 4;

/**
 * Create party state
 * @returns {Object} Party state
 */
export function createPartyState() {
  return {
    members: [],
    formation: {},
    recruited: [],
    dismissed: [],
    partyBuffs: [],
    partyLevel: 1,
    partyXp: 0,
  };
}

/**
 * Get party member data by ID
 * @param {string} memberId - Member ID
 * @returns {Object|null} Member data
 */
export function getPartyMemberData(memberId) {
  return PARTY_MEMBERS[memberId] || null;
}

/**
 * Get all party members
 * @returns {Array} All member definitions
 */
export function getAllPartyMembers() {
  return Object.values(PARTY_MEMBERS);
}

/**
 * Get party members by role
 * @param {string} role - Party role
 * @returns {Array} Members with that role
 */
export function getPartyMembersByRole(role) {
  return Object.values(PARTY_MEMBERS).filter(m => m.role === role);
}

/**
 * Check if member can be recruited
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {Object} gameState - Game state for quest checks
 * @returns {Object} Result with canRecruit and reason
 */
export function canRecruitMember(state, memberId, gameState = null) {
  const member = getPartyMemberData(memberId);
  if (!member) {
    return { canRecruit: false, reason: 'invalid_member' };
  }

  if (state.recruited.includes(memberId)) {
    return { canRecruit: false, reason: 'already_recruited' };
  }

  // Check party size (need room for player + members)
  if (state.members.length >= MAX_PARTY_SIZE - 1) {
    return { canRecruit: false, reason: 'party_full' };
  }

  // Check recruitment requirements
  if (member.recruitSource === RECRUIT_SOURCE.STORY || 
      member.recruitSource === RECRUIT_SOURCE.QUEST) {
    if (member.recruitQuestId && gameState) {
      const completed = gameState.questState?.completedQuests || [];
      if (!completed.includes(member.recruitQuestId)) {
        return { canRecruit: false, reason: 'quest_required', questId: member.recruitQuestId };
      }
    }
  }

  return { canRecruit: true, reason: null };
}

/**
 * Recruit a party member
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {Object} gameState - Game state
 * @returns {Object} Result with state and success
 */
export function recruitMember(state, memberId, gameState = null) {
  const check = canRecruitMember(state, memberId, gameState);
  if (!check.canRecruit) {
    return { state, success: false, reason: check.reason };
  }

  const member = getPartyMemberData(memberId);

  // Create member instance with stats
  const memberInstance = {
    id: memberId,
    level: state.partyLevel,
    hp: member.baseStats.hp,
    maxHp: member.baseStats.hp,
    stats: { ...member.baseStats },
    position: member.defaultPosition,
    isActive: true,
  };

  return {
    state: {
      ...state,
      members: [...state.members, memberInstance],
      recruited: [...state.recruited, memberId],
      formation: {
        ...state.formation,
        [memberId]: member.defaultPosition,
      },
    },
    success: true,
    member,
  };
}

/**
 * Dismiss a party member
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @returns {Object} Result with state and success
 */
export function dismissMember(state, memberId) {
  if (!state.members.some(m => m.id === memberId)) {
    return { state, success: false, reason: 'not_in_party' };
  }

  const { [memberId]: removed, ...remainingFormation } = state.formation;

  return {
    state: {
      ...state,
      members: state.members.filter(m => m.id !== memberId),
      formation: remainingFormation,
      dismissed: [...state.dismissed, memberId],
    },
    success: true,
  };
}

/**
 * Rejoin a dismissed member
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @returns {Object} Result with state and success
 */
export function rejoinMember(state, memberId) {
  if (!state.dismissed.includes(memberId) && !state.recruited.includes(memberId)) {
    return { state, success: false, reason: 'not_available' };
  }

  if (state.members.some(m => m.id === memberId)) {
    return { state, success: false, reason: 'already_in_party' };
  }

  if (state.members.length >= MAX_PARTY_SIZE - 1) {
    return { state, success: false, reason: 'party_full' };
  }

  const member = getPartyMemberData(memberId);
  if (!member) {
    return { state, success: false, reason: 'invalid_member' };
  }

  const memberInstance = {
    id: memberId,
    level: state.partyLevel,
    hp: member.baseStats.hp,
    maxHp: member.baseStats.hp,
    stats: { ...member.baseStats },
    position: member.defaultPosition,
    isActive: true,
  };

  return {
    state: {
      ...state,
      members: [...state.members, memberInstance],
      dismissed: state.dismissed.filter(m => m !== memberId),
      formation: {
        ...state.formation,
        [memberId]: member.defaultPosition,
      },
    },
    success: true,
    member,
  };
}

/**
 * Set member position in formation
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {string} position - Formation position
 * @returns {Object} Updated state
 */
export function setMemberPosition(state, memberId, position) {
  if (!state.members.some(m => m.id === memberId)) {
    return state;
  }

  if (position !== FORMATION.FRONT && position !== FORMATION.BACK) {
    return state;
  }

  return {
    ...state,
    members: state.members.map(m => 
      m.id === memberId ? { ...m, position } : m
    ),
    formation: {
      ...state.formation,
      [memberId]: position,
    },
  };
}

/**
 * Swap two members' positions
 * @param {Object} state - Party state
 * @param {string} member1Id - First member ID
 * @param {string} member2Id - Second member ID
 * @returns {Object} Updated state
 */
export function swapMemberPositions(state, member1Id, member2Id) {
  const member1 = state.members.find(m => m.id === member1Id);
  const member2 = state.members.find(m => m.id === member2Id);

  if (!member1 || !member2) {
    return state;
  }

  const pos1 = state.formation[member1Id];
  const pos2 = state.formation[member2Id];

  return {
    ...state,
    members: state.members.map(m => {
      if (m.id === member1Id) return { ...m, position: pos2 };
      if (m.id === member2Id) return { ...m, position: pos1 };
      return m;
    }),
    formation: {
      ...state.formation,
      [member1Id]: pos2,
      [member2Id]: pos1,
    },
  };
}

/**
 * Get party members by position
 * @param {Object} state - Party state
 * @param {string} position - Formation position
 * @returns {Array} Members in that position
 */
export function getMembersByPosition(state, position) {
  return state.members.filter(m => state.formation[m.id] === position);
}

/**
 * Get active party (for combat)
 * @param {Object} state - Party state
 * @returns {Array} Active party members
 */
export function getActiveParty(state) {
  return state.members.filter(m => m.isActive && m.hp > 0);
}

/**
 * Set member active state
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {boolean} isActive - Active state
 * @returns {Object} Updated state
 */
export function setMemberActive(state, memberId, isActive) {
  return {
    ...state,
    members: state.members.map(m => 
      m.id === memberId ? { ...m, isActive } : m
    ),
  };
}

/**
 * Heal party member
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {number} amount - Heal amount
 * @returns {Object} Updated state
 */
export function healPartyMember(state, memberId, amount) {
  return {
    ...state,
    members: state.members.map(m => {
      if (m.id !== memberId) return m;
      const newHp = Math.min(m.maxHp, m.hp + amount);
      return { ...m, hp: newHp };
    }),
  };
}

/**
 * Damage party member
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @param {number} amount - Damage amount
 * @returns {Object} Updated state
 */
export function damagePartyMember(state, memberId, amount) {
  return {
    ...state,
    members: state.members.map(m => {
      if (m.id !== memberId) return m;
      const newHp = Math.max(0, m.hp - amount);
      return { ...m, hp: newHp };
    }),
  };
}

/**
 * Heal all party members
 * @param {Object} state - Party state
 * @param {number} amount - Heal amount (or 'full')
 * @returns {Object} Updated state
 */
export function healAllPartyMembers(state, amount) {
  return {
    ...state,
    members: state.members.map(m => {
      const healAmount = amount === 'full' ? m.maxHp : amount;
      const newHp = Math.min(m.maxHp, m.hp + healAmount);
      return { ...m, hp: newHp };
    }),
  };
}

/**
 * Add party buff
 * @param {Object} state - Party state
 * @param {Object} buff - Buff object
 * @returns {Object} Updated state
 */
export function addPartyBuff(state, buff) {
  const existingIndex = state.partyBuffs.findIndex(b => b.id === buff.id);
  
  if (existingIndex >= 0) {
    // Refresh existing buff
    const updatedBuffs = [...state.partyBuffs];
    updatedBuffs[existingIndex] = { ...buff };
    return { ...state, partyBuffs: updatedBuffs };
  }

  return {
    ...state,
    partyBuffs: [...state.partyBuffs, buff],
  };
}

/**
 * Remove party buff
 * @param {Object} state - Party state
 * @param {string} buffId - Buff ID
 * @returns {Object} Updated state
 */
export function removePartyBuff(state, buffId) {
  return {
    ...state,
    partyBuffs: state.partyBuffs.filter(b => b.id !== buffId),
  };
}

/**
 * Process buff durations (call each turn)
 * @param {Object} state - Party state
 * @returns {Object} Updated state with expired buffs removed
 */
export function processBuffDurations(state) {
  const updatedBuffs = state.partyBuffs
    .map(buff => ({ ...buff, duration: (buff.duration || 1) - 1 }))
    .filter(buff => buff.duration > 0);

  return { ...state, partyBuffs: updatedBuffs };
}

/**
 * Get total party stats (for buffs)
 * @param {Object} state - Party state
 * @returns {Object} Combined stat modifiers
 */
export function getPartyBuffStats(state) {
  const stats = { attack: 0, defense: 0, speed: 0 };

  for (const buff of state.partyBuffs) {
    if (buff.attackBonus) stats.attack += buff.attackBonus;
    if (buff.defenseBonus) stats.defense += buff.defenseBonus;
    if (buff.speedBonus) stats.speed += buff.speedBonus;
  }

  return stats;
}

/**
 * Add XP to party
 * @param {Object} state - Party state
 * @param {number} xp - XP amount
 * @returns {Object} Updated state with level info
 */
export function addPartyXp(state, xp) {
  const newXp = state.partyXp + xp;
  const xpToLevel = state.partyLevel * 100;
  
  if (newXp >= xpToLevel) {
    // Level up!
    const newLevel = state.partyLevel + 1;
    const remainingXp = newXp - xpToLevel;
    
    // Level up all members
    const leveledMembers = state.members.map(m => ({
      ...m,
      level: newLevel,
      maxHp: m.maxHp + 10,
      hp: m.hp + 10,
      stats: {
        ...m.stats,
        hp: m.stats.hp + 10,
        attack: m.stats.attack + 2,
        defense: m.stats.defense + 1,
      },
    }));
    
    return {
      state: {
        ...state,
        partyLevel: newLevel,
        partyXp: remainingXp,
        members: leveledMembers,
      },
      leveledUp: true,
      newLevel,
    };
  }

  return {
    state: { ...state, partyXp: newXp },
    leveledUp: false,
  };
}

/**
 * Get party member by ID
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @returns {Object|null} Member instance
 */
export function getPartyMember(state, memberId) {
  return state.members.find(m => m.id === memberId) || null;
}

/**
 * Check if member is in party
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @returns {boolean} Whether member is in party
 */
export function isMemberInParty(state, memberId) {
  return state.members.some(m => m.id === memberId);
}

/**
 * Check if member was recruited
 * @param {Object} state - Party state
 * @param {string} memberId - Member ID
 * @returns {boolean} Whether member was recruited
 */
export function wasMemberRecruited(state, memberId) {
  return state.recruited.includes(memberId);
}

/**
 * Get party size
 * @param {Object} state - Party state
 * @returns {number} Current party size
 */
export function getPartySize(state) {
  return state.members.length;
}

/**
 * Get available party slots
 * @param {Object} state - Party state
 * @returns {number} Available slots
 */
export function getAvailableSlots(state) {
  return MAX_PARTY_SIZE - 1 - state.members.length;
}

/**
 * Get all party roles
 * @returns {Array} Party role strings
 */
export function getAllPartyRoles() {
  return Object.values(PARTY_ROLES);
}
