/**
 * Party System
 * Manages player groups, party formation, and cooperative gameplay
 */

// Party roles
export const PARTY_ROLES = {
  LEADER: { id: 'leader', name: 'Leader', canInvite: true, canKick: true, canPromote: true, canSetLoot: true },
  OFFICER: { id: 'officer', name: 'Officer', canInvite: true, canKick: false, canPromote: false, canSetLoot: false },
  MEMBER: { id: 'member', name: 'Member', canInvite: false, canKick: false, canPromote: false, canSetLoot: false }
};

// Loot distribution modes
export const LOOT_MODES = {
  FREE_FOR_ALL: { id: 'free_for_all', name: 'Free For All', description: 'Anyone can pick up loot' },
  ROUND_ROBIN: { id: 'round_robin', name: 'Round Robin', description: 'Loot is distributed in turns' },
  NEED_GREED: { id: 'need_greed', name: 'Need/Greed', description: 'Roll for items you want' },
  LEADER_ASSIGNS: { id: 'leader_assigns', name: 'Leader Assigns', description: 'Party leader distributes loot' },
  RANDOM: { id: 'random', name: 'Random', description: 'Loot is randomly assigned' }
};

// Party sizes
export const PARTY_SIZES = {
  SMALL: { id: 'small', name: 'Small Party', maxMembers: 4 },
  STANDARD: { id: 'standard', name: 'Standard Party', maxMembers: 6 },
  RAID: { id: 'raid', name: 'Raid Group', maxMembers: 12 },
  LARGE_RAID: { id: 'large_raid', name: 'Large Raid', maxMembers: 24 }
};

// Experience share modes
export const EXP_SHARE_MODES = {
  EQUAL: { id: 'equal', name: 'Equal Share', description: 'Experience split equally' },
  CONTRIBUTION: { id: 'contribution', name: 'By Contribution', description: 'Experience based on damage dealt' },
  LEVEL_SCALED: { id: 'level_scaled', name: 'Level Scaled', description: 'Lower levels get bonus experience' }
};

// Party buff types
export const PARTY_BUFFS = {
  UNITY: { id: 'unity', name: 'Unity', effect: 'All stats +5%', requirement: 4 },
  STRENGTH_IN_NUMBERS: { id: 'strength_in_numbers', name: 'Strength in Numbers', effect: 'Damage +10%', requirement: 6 },
  COORDINATED: { id: 'coordinated', name: 'Coordinated', effect: 'Critical +5%', requirement: 3 },
  FELLOWSHIP: { id: 'fellowship', name: 'Fellowship', effect: 'Experience +15%', requirement: 4 }
};

// Maximum pending invites per party
const MAX_PENDING_INVITES = 10;

/**
 * Initialize party state for a player
 */
export function initPartyState() {
  return {
    currentParty: null,
    pendingInvites: [],
    partyHistory: [],
    totalPartiesJoined: 0,
    totalPartiesLed: 0,
    preferredRole: null,
    autoDeclineInvites: false
  };
}

/**
 * Get party state from game state
 */
export function getPartyState(state) {
  return state.party || initPartyState();
}

/**
 * Create a new party
 */
export function createParty(state, leaderId, options = {}) {
  const {
    name = `${leaderId}'s Party`,
    partySize = 'standard',
    lootMode = 'need_greed',
    expShareMode = 'equal',
    isPrivate = false
  } = options;

  const partyState = getPartyState(state);

  // Check if already in a party
  if (partyState.currentParty) {
    return { state, created: false, error: 'Already in a party' };
  }

  const sizeConfig = PARTY_SIZES[partySize.toUpperCase()];
  if (!sizeConfig) {
    return { state, created: false, error: 'Invalid party size' };
  }

  const party = {
    id: `party_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    leaderId,
    members: [{
      playerId: leaderId,
      role: 'leader',
      joinedAt: Date.now()
    }],
    pendingInvites: [],
    settings: {
      partySize: sizeConfig.id,
      maxMembers: sizeConfig.maxMembers,
      lootMode,
      expShareMode,
      isPrivate
    },
    createdAt: Date.now(),
    totalLootDistributed: 0,
    totalExpShared: 0,
    roundRobinIndex: 0
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: party,
        totalPartiesLed: partyState.totalPartiesLed + 1
      }
    },
    created: true,
    party
  };
}

/**
 * Invite a player to the party
 */
export function inviteToParty(state, inviterId, inviteeId) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, invited: false, error: 'Not in a party' };
  }

  // Check permissions
  const inviter = party.members.find(m => m.playerId === inviterId);
  if (!inviter) {
    return { state, invited: false, error: 'Not a party member' };
  }

  const role = PARTY_ROLES[inviter.role.toUpperCase()];
  if (!role || !role.canInvite) {
    return { state, invited: false, error: 'No permission to invite' };
  }

  // Check if party is full
  if (party.members.length >= party.settings.maxMembers) {
    return { state, invited: false, error: 'Party is full' };
  }

  // Check if already invited
  if (party.pendingInvites.includes(inviteeId)) {
    return { state, invited: false, error: 'Already invited' };
  }

  // Check if already in party
  if (party.members.some(m => m.playerId === inviteeId)) {
    return { state, invited: false, error: 'Already in party' };
  }

  // Check max pending invites
  if (party.pendingInvites.length >= MAX_PENDING_INVITES) {
    return { state, invited: false, error: 'Too many pending invites' };
  }

  const invite = {
    partyId: party.id,
    partyName: party.name,
    inviterId,
    invitedAt: Date.now(),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minute expiry
  };

  const updatedParty = {
    ...party,
    pendingInvites: [...party.pendingInvites, inviteeId]
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    invited: true,
    invite
  };
}

/**
 * Accept a party invite (from invitee's perspective)
 */
export function acceptInvite(state, playerId, partyId, partyData) {
  const partyState = getPartyState(state);

  if (partyState.currentParty) {
    return { state, joined: false, error: 'Already in a party' };
  }

  // The partyData would be passed from the party leader's state
  // This simulates joining that party

  const newMember = {
    playerId,
    role: 'member',
    joinedAt: Date.now()
  };

  // Create a local copy of the party for this player
  const joinedParty = {
    ...partyData,
    members: [...partyData.members, newMember],
    pendingInvites: partyData.pendingInvites.filter(id => id !== playerId)
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: joinedParty,
        pendingInvites: partyState.pendingInvites.filter(i => i.partyId !== partyId),
        totalPartiesJoined: partyState.totalPartiesJoined + 1,
        partyHistory: [
          ...partyState.partyHistory,
          { partyId, partyName: partyData.name, joinedAt: Date.now() }
        ].slice(-50)
      }
    },
    joined: true,
    party: joinedParty
  };
}

/**
 * Decline a party invite
 */
export function declineInvite(state, partyId) {
  const partyState = getPartyState(state);

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        pendingInvites: partyState.pendingInvites.filter(i => i.partyId !== partyId)
      }
    },
    declined: true
  };
}

/**
 * Leave the current party
 */
export function leaveParty(state, playerId) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, left: false, error: 'Not in a party' };
  }

  const member = party.members.find(m => m.playerId === playerId);
  if (!member) {
    return { state, left: false, error: 'Not in this party' };
  }

  // If leader leaves, party disbands or new leader assigned
  let disbanded = false;
  let newLeader = null;

  if (member.role === 'leader') {
    const remainingMembers = party.members.filter(m => m.playerId !== playerId);
    if (remainingMembers.length === 0) {
      disbanded = true;
    } else {
      // Promote first officer or first member to leader
      const officer = remainingMembers.find(m => m.role === 'officer');
      newLeader = officer ? officer.playerId : remainingMembers[0].playerId;
    }
  }

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: null,
        partyHistory: [
          ...partyState.partyHistory,
          { partyId: party.id, partyName: party.name, leftAt: Date.now() }
        ].slice(-50)
      }
    },
    left: true,
    disbanded,
    newLeader
  };
}

/**
 * Kick a member from the party
 */
export function kickMember(state, kickerId, targetId) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, kicked: false, error: 'Not in a party' };
  }

  const kicker = party.members.find(m => m.playerId === kickerId);
  if (!kicker) {
    return { state, kicked: false, error: 'Not a party member' };
  }

  const role = PARTY_ROLES[kicker.role.toUpperCase()];
  if (!role || !role.canKick) {
    return { state, kicked: false, error: 'No permission to kick' };
  }

  const target = party.members.find(m => m.playerId === targetId);
  if (!target) {
    return { state, kicked: false, error: 'Target not in party' };
  }

  // Cannot kick the leader
  if (target.role === 'leader') {
    return { state, kicked: false, error: 'Cannot kick the leader' };
  }

  const updatedParty = {
    ...party,
    members: party.members.filter(m => m.playerId !== targetId)
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    kicked: true,
    kickedPlayer: targetId
  };
}

/**
 * Promote a member to a higher role
 */
export function promoteMember(state, promoterId, targetId, newRole) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, promoted: false, error: 'Not in a party' };
  }

  const promoter = party.members.find(m => m.playerId === promoterId);
  if (!promoter) {
    return { state, promoted: false, error: 'Not a party member' };
  }

  const role = PARTY_ROLES[promoter.role.toUpperCase()];
  if (!role || !role.canPromote) {
    return { state, promoted: false, error: 'No permission to promote' };
  }

  const target = party.members.find(m => m.playerId === targetId);
  if (!target) {
    return { state, promoted: false, error: 'Target not in party' };
  }

  if (!PARTY_ROLES[newRole.toUpperCase()]) {
    return { state, promoted: false, error: 'Invalid role' };
  }

  // If promoting to leader, demote current leader
  let updatedMembers = party.members.map(m => {
    if (m.playerId === targetId) {
      return { ...m, role: newRole };
    }
    if (newRole === 'leader' && m.playerId === promoterId) {
      return { ...m, role: 'officer' };
    }
    return m;
  });

  const updatedParty = {
    ...party,
    members: updatedMembers,
    leaderId: newRole === 'leader' ? targetId : party.leaderId
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    promoted: true,
    targetId,
    newRole
  };
}

/**
 * Change party settings
 */
export function changePartySettings(state, playerId, settings) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, changed: false, error: 'Not in a party' };
  }

  const member = party.members.find(m => m.playerId === playerId);
  if (!member) {
    return { state, changed: false, error: 'Not a party member' };
  }

  const role = PARTY_ROLES[member.role.toUpperCase()];
  if (!role || !role.canSetLoot) {
    return { state, changed: false, error: 'No permission to change settings' };
  }

  const updatedParty = {
    ...party,
    settings: {
      ...party.settings,
      ...settings
    }
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    changed: true,
    newSettings: updatedParty.settings
  };
}

/**
 * Distribute loot based on current mode
 */
export function distributeLoot(state, item) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, distributed: false, error: 'Not in a party' };
  }

  const mode = party.settings.lootMode;
  let recipient = null;

  switch (mode) {
    case 'round_robin':
      const index = party.roundRobinIndex % party.members.length;
      recipient = party.members[index].playerId;
      break;

    case 'random':
      const randomIndex = Math.floor(Math.random() * party.members.length);
      recipient = party.members[randomIndex].playerId;
      break;

    case 'leader_assigns':
      recipient = party.leaderId; // Leader holds until assigned
      break;

    case 'free_for_all':
    case 'need_greed':
    default:
      recipient = null; // No auto-assignment
      break;
  }

  const updatedParty = {
    ...party,
    totalLootDistributed: party.totalLootDistributed + 1,
    roundRobinIndex: mode === 'round_robin' ? party.roundRobinIndex + 1 : party.roundRobinIndex
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    distributed: true,
    recipient,
    mode,
    item
  };
}

/**
 * Share experience with party
 */
export function shareExperience(state, baseExp, contributorId = null, contributions = {}) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, shared: false, error: 'Not in a party' };
  }

  const mode = party.settings.expShareMode;
  const memberCount = party.members.length;
  const shares = {};

  switch (mode) {
    case 'equal':
      const equalShare = Math.floor(baseExp / memberCount);
      party.members.forEach(m => {
        shares[m.playerId] = equalShare;
      });
      break;

    case 'contribution':
      if (contributorId && !contributions[contributorId]) {
        contributions[contributorId] = 100; // Default full contribution to contributor
      }
      const totalContribution = Object.values(contributions).reduce((a, b) => a + b, 0) || 100;
      party.members.forEach(m => {
        const contrib = contributions[m.playerId] || 0;
        shares[m.playerId] = Math.floor(baseExp * (contrib / totalContribution));
      });
      break;

    case 'level_scaled':
      // Would need level info - for now just equal share
      const scaledShare = Math.floor(baseExp / memberCount);
      party.members.forEach(m => {
        shares[m.playerId] = scaledShare;
      });
      break;

    default:
      const defaultShare = Math.floor(baseExp / memberCount);
      party.members.forEach(m => {
        shares[m.playerId] = defaultShare;
      });
  }

  const totalShared = Object.values(shares).reduce((a, b) => a + b, 0);

  const updatedParty = {
    ...party,
    totalExpShared: party.totalExpShared + totalShared
  };

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: updatedParty
      }
    },
    shared: true,
    shares,
    totalShared,
    mode
  };
}

/**
 * Get active party buffs
 */
export function getActiveBuffs(state) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return [];
  }

  const memberCount = party.members.length;
  const activeBuffs = [];

  Object.values(PARTY_BUFFS).forEach(buff => {
    if (memberCount >= buff.requirement) {
      activeBuffs.push(buff);
    }
  });

  return activeBuffs;
}

/**
 * Get party member info
 */
export function getPartyMembers(state) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return [];
  }

  return party.members.map(m => ({
    ...m,
    roleData: PARTY_ROLES[m.role.toUpperCase()]
  }));
}

/**
 * Get party statistics
 */
export function getPartyStats(state) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return {
      inParty: false,
      totalPartiesJoined: partyState.totalPartiesJoined,
      totalPartiesLed: partyState.totalPartiesLed
    };
  }

  return {
    inParty: true,
    partyId: party.id,
    partyName: party.name,
    memberCount: party.members.length,
    maxMembers: party.settings.maxMembers,
    lootMode: party.settings.lootMode,
    expShareMode: party.settings.expShareMode,
    totalLootDistributed: party.totalLootDistributed,
    totalExpShared: party.totalExpShared,
    activeBuffs: getActiveBuffs(state),
    totalPartiesJoined: partyState.totalPartiesJoined,
    totalPartiesLed: partyState.totalPartiesLed
  };
}

/**
 * Disband the party (leader only)
 */
export function disbandParty(state, leaderId) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { state, disbanded: false, error: 'Not in a party' };
  }

  if (party.leaderId !== leaderId) {
    return { state, disbanded: false, error: 'Only the leader can disband' };
  }

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        currentParty: null,
        partyHistory: [
          ...partyState.partyHistory,
          { partyId: party.id, partyName: party.name, disbandedAt: Date.now() }
        ].slice(-50)
      }
    },
    disbanded: true,
    partyId: party.id
  };
}

/**
 * Set preferred role
 */
export function setPreferredRole(state, role) {
  if (role !== null && !PARTY_ROLES[role.toUpperCase()]) {
    return { state, success: false, error: 'Invalid role' };
  }

  const partyState = getPartyState(state);

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        preferredRole: role
      }
    },
    success: true,
    preferredRole: role
  };
}

/**
 * Toggle auto-decline invites
 */
export function toggleAutoDecline(state, enabled) {
  const partyState = getPartyState(state);

  return {
    state: {
      ...state,
      party: {
        ...partyState,
        autoDeclineInvites: enabled
      }
    },
    success: true,
    autoDeclineInvites: enabled
  };
}

/**
 * Check if player can perform action
 */
export function canPerformAction(state, playerId, action) {
  const partyState = getPartyState(state);
  const party = partyState.currentParty;

  if (!party) {
    return { allowed: false, error: 'Not in a party' };
  }

  const member = party.members.find(m => m.playerId === playerId);
  if (!member) {
    return { allowed: false, error: 'Not a party member' };
  }

  const role = PARTY_ROLES[member.role.toUpperCase()];
  if (!role) {
    return { allowed: false, error: 'Invalid role' };
  }

  const allowed = role[action] === true;
  return { allowed, role: role.id };
}
