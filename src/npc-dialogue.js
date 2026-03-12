/**
 * NPC and Dialogue System
 * Manages NPCs, conversations, dialogue trees, and choices
 */

/**
 * NPC types
 */
export const NPC_TYPES = {
  QUEST_GIVER: 'quest-giver',
  MERCHANT: 'merchant',
  TRAINER: 'trainer',
  VILLAGER: 'villager',
  GUARD: 'guard',
  INNKEEPER: 'innkeeper',
  BLACKSMITH: 'blacksmith',
  HEALER: 'healer',
};

/**
 * Dialogue node types
 */
export const NODE_TYPES = {
  TEXT: 'text',
  CHOICE: 'choice',
  CONDITIONAL: 'conditional',
  ACTION: 'action',
  END: 'end',
};

/**
 * NPC data definitions
 */
export const NPC_DATA = {
  'village-elder': {
    id: 'village-elder',
    name: 'Elder Theron',
    type: NPC_TYPES.QUEST_GIVER,
    portrait: '\uD83D\uDC74',
    location: 'village-square',
    greeting: 'Welcome, young traveler. Our village needs your help.',
    dialogues: ['elder-intro', 'elder-quest-1'],
  },
  'blacksmith': {
    id: 'blacksmith',
    name: 'Smith Gareth',
    type: NPC_TYPES.BLACKSMITH,
    portrait: '\uD83D\uDC68\u200D\uD83D\uDD27',
    location: 'smithy',
    greeting: 'Need something forged? I make the finest blades.',
    dialogues: ['smith-intro', 'smith-upgrade'],
  },
  'healer': {
    id: 'healer',
    name: 'Priestess Sera',
    type: NPC_TYPES.HEALER,
    portrait: '\uD83D\uDC69\u200D\u2695\uFE0F',
    location: 'temple',
    greeting: 'May the light guide you. Do you need healing?',
    dialogues: ['healer-intro', 'healer-service'],
  },
  'merchant-carlo': {
    id: 'merchant-carlo',
    name: 'Merchant Carlo',
    type: NPC_TYPES.MERCHANT,
    portrait: '\uD83E\uDDD4',
    location: 'market',
    greeting: 'Fine wares for sale! Take a look at my stock.',
    dialogues: ['merchant-intro', 'merchant-buy'],
  },
  'guard-captain': {
    id: 'guard-captain',
    name: 'Captain Helena',
    type: NPC_TYPES.GUARD,
    portrait: '\uD83D\uDC82\u200D\u2640\uFE0F',
    location: 'barracks',
    greeting: 'Stay vigilant, adventurer. Monsters lurk beyond the gates.',
    dialogues: ['guard-intro', 'guard-bounty'],
  },
  'innkeeper': {
    id: 'innkeeper',
    name: 'Innkeeper Mira',
    type: NPC_TYPES.INNKEEPER,
    portrait: '\uD83D\uDC69\u200D\uD83C\uDF73',
    location: 'inn',
    greeting: 'Welcome to the Wandering Dragon Inn! Need a room?',
    dialogues: ['inn-intro', 'inn-rest'],
  },
  'trainer-kai': {
    id: 'trainer-kai',
    name: 'Master Kai',
    type: NPC_TYPES.TRAINER,
    portrait: '\uD83E\uDDD8',
    location: 'dojo',
    greeting: 'Seek to improve your skills? I can teach you.',
    dialogues: ['trainer-intro', 'trainer-learn'],
  },
  'villager-marie': {
    id: 'villager-marie',
    name: 'Marie',
    type: NPC_TYPES.VILLAGER,
    portrait: '\uD83D\uDC69\u200D\uD83C\uDF3E',
    location: 'village-square',
    greeting: 'Oh, hello there! Have you seen my ring anywhere?',
    dialogues: ['marie-intro', 'marie-ring'],
  },
};

/**
 * Dialogue tree definitions
 */
export const DIALOGUE_TREES = {
  'elder-intro': {
    id: 'elder-intro',
    npcId: 'village-elder',
    startNode: 'start',
    nodes: {
      'start': {
        type: NODE_TYPES.TEXT,
        speaker: 'village-elder',
        text: 'Ah, you must be the one who appeared near the old ruins. Strange times bring strange arrivals.',
        next: 'explain',
      },
      'explain': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'How can I respond?',
        choices: [
          { text: 'Where am I? What is this place?', next: 'location' },
          { text: 'What do you mean by strange times?', next: 'danger' },
          { text: 'I should go explore.', next: 'farewell' },
        ],
      },
      'location': {
        type: NODE_TYPES.TEXT,
        speaker: 'village-elder',
        text: 'This is Willowbrook Village, a peaceful hamlet on the edge of the Dark Forest. We are simple folk, but we have always protected our own.',
        next: 'danger',
      },
      'danger': {
        type: NODE_TYPES.TEXT,
        speaker: 'village-elder',
        text: 'Goblins have been raiding our farms. They come from the forest in increasing numbers. We need someone to help defend us.',
        next: 'offer-help',
      },
      'offer-help': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'What will you do?',
        choices: [
          { text: 'I will help defend the village.', next: 'accept', action: { type: 'START_QUEST', questId: 'awakening' } },
          { text: 'I need to prepare first.', next: 'farewell' },
        ],
      },
      'accept': {
        type: NODE_TYPES.TEXT,
        speaker: 'village-elder',
        text: 'Thank you, brave soul. Speak to Captain Helena at the barracks. She will tell you where the goblins have been spotted.',
        next: 'end',
      },
      'farewell': {
        type: NODE_TYPES.TEXT,
        speaker: 'village-elder',
        text: 'Take your time. When you are ready, come speak with me again.',
        next: 'end',
      },
      'end': {
        type: NODE_TYPES.END,
      },
    },
  },
  'smith-intro': {
    id: 'smith-intro',
    npcId: 'blacksmith',
    startNode: 'start',
    nodes: {
      'start': {
        type: NODE_TYPES.TEXT,
        speaker: 'blacksmith',
        text: 'These arms have forged a thousand blades. What brings you to my smithy?',
        next: 'choice',
      },
      'choice': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'Select an option:',
        choices: [
          { text: 'Can you upgrade my weapon?', next: 'upgrade' },
          { text: 'What items do you sell?', next: 'shop' },
          { text: 'Just browsing.', next: 'end' },
        ],
      },
      'upgrade': {
        type: NODE_TYPES.CONDITIONAL,
        condition: { type: 'HAS_ITEM', itemId: 'iron-ore', amount: 3 },
        trueNode: 'can-upgrade',
        falseNode: 'need-materials',
      },
      'can-upgrade': {
        type: NODE_TYPES.TEXT,
        speaker: 'blacksmith',
        text: 'I see you have the iron ore. For 50 gold, I can strengthen your blade.',
        next: 'upgrade-choice',
      },
      'upgrade-choice': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'Do you want to upgrade?',
        choices: [
          { text: 'Yes, upgrade my weapon.', next: 'do-upgrade', action: { type: 'UPGRADE_WEAPON', cost: 50 } },
          { text: 'Not right now.', next: 'end' },
        ],
      },
      'do-upgrade': {
        type: NODE_TYPES.TEXT,
        speaker: 'blacksmith',
        text: 'Done! Your weapon is now stronger. Use it well against your enemies.',
        next: 'end',
      },
      'need-materials': {
        type: NODE_TYPES.TEXT,
        speaker: 'blacksmith',
        text: 'You need 3 iron ore for an upgrade. Try the mines east of here.',
        next: 'end',
      },
      'shop': {
        type: NODE_TYPES.ACTION,
        action: { type: 'OPEN_SHOP', shopId: 'blacksmith-shop' },
        next: 'end',
      },
      'end': {
        type: NODE_TYPES.END,
      },
    },
  },
  'healer-intro': {
    id: 'healer-intro',
    npcId: 'healer',
    startNode: 'start',
    nodes: {
      'start': {
        type: NODE_TYPES.TEXT,
        speaker: 'healer',
        text: 'The light shines upon you, traveler. I sense weariness in your spirit.',
        next: 'choice',
      },
      'choice': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'What would you like?',
        choices: [
          { text: 'Please heal me.', next: 'heal-check' },
          { text: 'Do you sell potions?', next: 'potions' },
          { text: 'Goodbye.', next: 'end' },
        ],
      },
      'heal-check': {
        type: NODE_TYPES.CONDITIONAL,
        condition: { type: 'PLAYER_HURT' },
        trueNode: 'heal',
        falseNode: 'full-health',
      },
      'heal': {
        type: NODE_TYPES.ACTION,
        action: { type: 'HEAL_PLAYER', amount: 'full' },
        next: 'heal-done',
      },
      'heal-done': {
        type: NODE_TYPES.TEXT,
        speaker: 'healer',
        text: 'Your wounds are mended. Go forth with renewed strength.',
        next: 'end',
      },
      'full-health': {
        type: NODE_TYPES.TEXT,
        speaker: 'healer',
        text: 'You are already in good health. No healing needed.',
        next: 'end',
      },
      'potions': {
        type: NODE_TYPES.ACTION,
        action: { type: 'OPEN_SHOP', shopId: 'healer-shop' },
        next: 'end',
      },
      'end': {
        type: NODE_TYPES.END,
      },
    },
  },
  'inn-rest': {
    id: 'inn-rest',
    npcId: 'innkeeper',
    startNode: 'start',
    nodes: {
      'start': {
        type: NODE_TYPES.TEXT,
        speaker: 'innkeeper',
        text: 'A room costs 10 gold for the night. Would you like to rest?',
        next: 'choice',
      },
      'choice': {
        type: NODE_TYPES.CHOICE,
        speaker: 'player',
        text: 'Would you like to rest?',
        choices: [
          { text: 'Yes, I need rest.', next: 'rest-check' },
          { text: 'Just a drink, please.', next: 'drink' },
          { text: 'Maybe later.', next: 'end' },
        ],
      },
      'rest-check': {
        type: NODE_TYPES.CONDITIONAL,
        condition: { type: 'HAS_GOLD', amount: 10 },
        trueNode: 'rest',
        falseNode: 'no-gold',
      },
      'rest': {
        type: NODE_TYPES.ACTION,
        action: { type: 'REST_AT_INN', cost: 10 },
        next: 'rest-done',
      },
      'rest-done': {
        type: NODE_TYPES.TEXT,
        speaker: 'innkeeper',
        text: 'Sleep well! You wake feeling refreshed and ready for adventure.',
        next: 'end',
      },
      'no-gold': {
        type: NODE_TYPES.TEXT,
        speaker: 'innkeeper',
        text: 'Sorry, but you need at least 10 gold for a room.',
        next: 'end',
      },
      'drink': {
        type: NODE_TYPES.TEXT,
        speaker: 'innkeeper',
        text: 'Here you go! The finest ale in the region.',
        next: 'end',
      },
      'end': {
        type: NODE_TYPES.END,
      },
    },
  },
};

/**
 * Create dialogue state
 * @returns {Object} Dialogue state
 */
export function createDialogueState() {
  return {
    currentNpcId: null,
    currentDialogueId: null,
    currentNodeId: null,
    dialogueHistory: [],
    npcRelations: {},
    talkedTo: [],
  };
}

/**
 * Get NPC data by ID
 * @param {string} npcId - NPC ID
 * @returns {Object|null} NPC data
 */
export function getNpcData(npcId) {
  return NPC_DATA[npcId] || null;
}

/**
 * Get dialogue tree by ID
 * @param {string} dialogueId - Dialogue ID
 * @returns {Object|null} Dialogue tree
 */
export function getDialogueTree(dialogueId) {
  return DIALOGUE_TREES[dialogueId] || null;
}

/**
 * Get all NPCs
 * @returns {Array} Array of all NPCs
 */
export function getAllNpcs() {
  return Object.values(NPC_DATA);
}

/**
 * Get NPCs by location
 * @param {string} locationId - Location ID
 * @returns {Array} Array of NPCs at location
 */
export function getNpcsByLocation(locationId) {
  return Object.values(NPC_DATA).filter(npc => npc.location === locationId);
}

/**
 * Get NPCs by type
 * @param {string} type - NPC type
 * @returns {Array} Array of NPCs of type
 */
export function getNpcsByType(type) {
  return Object.values(NPC_DATA).filter(npc => npc.type === type);
}

/**
 * Start dialogue with NPC
 * @param {Object} state - Dialogue state
 * @param {string} npcId - NPC ID
 * @param {string} dialogueId - Optional specific dialogue ID
 * @returns {Object} Result with state, success, and first node
 */
export function startDialogue(state, npcId, dialogueId = null) {
  const npc = getNpcData(npcId);
  if (!npc) {
    return { state, success: false, reason: 'invalid_npc' };
  }

  // Find dialogue to use
  const targetDialogueId = dialogueId || (npc.dialogues ? npc.dialogues[0] : null);
  if (!targetDialogueId) {
    return { state, success: false, reason: 'no_dialogue' };
  }

  const dialogue = getDialogueTree(targetDialogueId);
  if (!dialogue) {
    return { state, success: false, reason: 'invalid_dialogue' };
  }

  const startNode = dialogue.nodes[dialogue.startNode];
  if (!startNode) {
    return { state, success: false, reason: 'invalid_start_node' };
  }

  // Mark as talked to
  const talkedTo = state.talkedTo.includes(npcId)
    ? state.talkedTo
    : [...state.talkedTo, npcId];

  return {
    state: {
      ...state,
      currentNpcId: npcId,
      currentDialogueId: targetDialogueId,
      currentNodeId: dialogue.startNode,
      talkedTo,
    },
    success: true,
    npc,
    node: startNode,
    nodeId: dialogue.startNode,
  };
}

/**
 * Get current dialogue node
 * @param {Object} state - Dialogue state
 * @returns {Object|null} Current node and metadata
 */
export function getCurrentNode(state) {
  if (!state.currentDialogueId || !state.currentNodeId) {
    return null;
  }

  const dialogue = getDialogueTree(state.currentDialogueId);
  if (!dialogue) return null;

  const node = dialogue.nodes[state.currentNodeId];
  if (!node) return null;

  const npc = getNpcData(state.currentNpcId);

  return {
    node,
    nodeId: state.currentNodeId,
    npc,
    dialogueId: state.currentDialogueId,
  };
}

/**
 * Advance dialogue to next node
 * @param {Object} state - Dialogue state
 * @param {string|null} nextNodeId - Next node ID (for choices)
 * @returns {Object} Result with state and next node
 */
export function advanceDialogue(state, nextNodeId = null) {
  const current = getCurrentNode(state);
  if (!current) {
    return { state, success: false, reason: 'no_active_dialogue' };
  }

  const { node, dialogueId } = current;
  const dialogue = getDialogueTree(dialogueId);

  // Determine next node
  let targetNodeId;

  if (node.type === NODE_TYPES.CHOICE) {
    // Must provide a choice
    if (!nextNodeId) {
      return { state, success: false, reason: 'choice_required' };
    }
    targetNodeId = nextNodeId;
  } else if (node.type === NODE_TYPES.END) {
    // End of dialogue
    return endDialogue(state);
  } else {
    // Use node's next property
    targetNodeId = node.next;
  }

  if (!targetNodeId) {
    return { state, success: false, reason: 'no_next_node' };
  }

  const nextNode = dialogue.nodes[targetNodeId];
  if (!nextNode) {
    return { state, success: false, reason: 'invalid_next_node' };
  }

  // Check for actions on the choice (if coming from a choice)
  let action = null;
  if (node.type === NODE_TYPES.CHOICE && node.choices) {
    const choice = node.choices.find(c => c.next === nextNodeId);
    if (choice && choice.action) {
      action = choice.action;
    }
  }

  // Handle action nodes
  if (nextNode.type === NODE_TYPES.ACTION) {
    action = nextNode.action;
  }

  // Add to history
  const historyEntry = {
    nodeId: state.currentNodeId,
    speaker: node.speaker,
    text: node.text,
    timestamp: Date.now(),
  };

  return {
    state: {
      ...state,
      currentNodeId: targetNodeId,
      dialogueHistory: [...state.dialogueHistory, historyEntry],
    },
    success: true,
    node: nextNode,
    nodeId: targetNodeId,
    action,
  };
}

/**
 * Process choice in dialogue
 * @param {Object} state - Dialogue state
 * @param {number} choiceIndex - Index of choice (0-based)
 * @returns {Object} Result with state and next node
 */
export function selectChoice(state, choiceIndex) {
  const current = getCurrentNode(state);
  if (!current) {
    return { state, success: false, reason: 'no_active_dialogue' };
  }

  const { node } = current;
  if (node.type !== NODE_TYPES.CHOICE) {
    return { state, success: false, reason: 'not_a_choice_node' };
  }

  if (!node.choices || choiceIndex < 0 || choiceIndex >= node.choices.length) {
    return { state, success: false, reason: 'invalid_choice' };
  }

  const choice = node.choices[choiceIndex];
  return advanceDialogue(state, choice.next);
}

/**
 * Evaluate a conditional node
 * @param {Object} state - Dialogue state
 * @param {Object} gameState - Full game state for condition checks
 * @returns {Object} Result with next node based on condition
 */
export function evaluateConditional(state, gameState) {
  const current = getCurrentNode(state);
  if (!current) {
    return { state, success: false, reason: 'no_active_dialogue' };
  }

  const { node } = current;
  if (node.type !== NODE_TYPES.CONDITIONAL) {
    return { state, success: false, reason: 'not_a_conditional_node' };
  }

  const conditionMet = checkCondition(node.condition, gameState);
  const nextNodeId = conditionMet ? node.trueNode : node.falseNode;

  return advanceDialogue(state, nextNodeId);
}

/**
 * Check if condition is met
 * @param {Object} condition - Condition object
 * @param {Object} gameState - Game state
 * @returns {boolean} Whether condition is met
 */
export function checkCondition(condition, gameState) {
  if (!condition || !gameState) return false;

  switch (condition.type) {
    case 'HAS_ITEM': {
      const inventory = gameState.player?.inventory || {};
      const count = inventory[condition.itemId] || 0;
      return count >= (condition.amount || 1);
    }
    case 'HAS_GOLD': {
      const gold = gameState.player?.gold || 0;
      return gold >= (condition.amount || 0);
    }
    case 'PLAYER_HURT': {
      const hp = gameState.player?.hp ?? 100;
      const maxHp = gameState.player?.maxHp ?? 100;
      return hp < maxHp;
    }
    case 'QUEST_COMPLETE': {
      const completed = gameState.questState?.completedQuests || [];
      return completed.includes(condition.questId);
    }
    case 'QUEST_ACTIVE': {
      const active = gameState.questState?.activeQuests || [];
      return active.includes(condition.questId);
    }
    case 'HAS_SKILL': {
      const skills = gameState.player?.skills || [];
      return skills.includes(condition.skillId);
    }
    case 'LEVEL_AT_LEAST': {
      const level = gameState.player?.level || 1;
      return level >= (condition.level || 1);
    }
    case 'RELATION_AT_LEAST': {
      const relations = gameState.dialogueState?.npcRelations || {};
      const relation = relations[condition.npcId] || 0;
      return relation >= (condition.amount || 0);
    }
    default:
      return false;
  }
}

/**
 * End current dialogue
 * @param {Object} state - Dialogue state
 * @returns {Object} Result with cleared state
 */
export function endDialogue(state) {
  return {
    state: {
      ...state,
      currentNpcId: null,
      currentDialogueId: null,
      currentNodeId: null,
    },
    success: true,
    ended: true,
  };
}

/**
 * Check if dialogue is active
 * @param {Object} state - Dialogue state
 * @returns {boolean} Whether a dialogue is active
 */
export function isDialogueActive(state) {
  return state.currentNpcId !== null && state.currentDialogueId !== null;
}

/**
 * Get dialogue history
 * @param {Object} state - Dialogue state
 * @param {number} limit - Max entries to return
 * @returns {Array} Dialogue history entries
 */
export function getDialogueHistory(state, limit = 10) {
  const history = state.dialogueHistory || [];
  return history.slice(-limit);
}

/**
 * Update NPC relation
 * @param {Object} state - Dialogue state
 * @param {string} npcId - NPC ID
 * @param {number} change - Relation change (positive or negative)
 * @returns {Object} Updated state
 */
export function updateNpcRelation(state, npcId, change) {
  const currentRelation = state.npcRelations[npcId] || 0;
  const newRelation = Math.max(-100, Math.min(100, currentRelation + change));

  return {
    ...state,
    npcRelations: {
      ...state.npcRelations,
      [npcId]: newRelation,
    },
  };
}

/**
 * Get NPC relation level
 * @param {Object} state - Dialogue state
 * @param {string} npcId - NPC ID
 * @returns {number} Relation level (-100 to 100)
 */
export function getNpcRelation(state, npcId) {
  return state.npcRelations?.[npcId] || 0;
}

/**
 * Check if player has talked to NPC
 * @param {Object} state - Dialogue state
 * @param {string} npcId - NPC ID
 * @returns {boolean} Whether player has talked to NPC
 */
export function hasTalkedTo(state, npcId) {
  return state.talkedTo?.includes(npcId) || false;
}

/**
 * Get all available dialogues for NPC
 * @param {string} npcId - NPC ID
 * @returns {Array} Array of dialogue IDs
 */
export function getNpcDialogues(npcId) {
  const npc = getNpcData(npcId);
  return npc?.dialogues || [];
}

/**
 * Get all NPC types
 * @returns {Array} Array of NPC type strings
 */
export function getAllNpcTypes() {
  return Object.values(NPC_TYPES);
}
