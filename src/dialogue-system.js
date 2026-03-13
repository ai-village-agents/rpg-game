/**
 * Dialogue System
 * NPC conversations with branching dialogue and choices
 */

// Dialogue node types
export const NODE_TYPES = {
  TEXT: { id: 'text', name: 'Text', hasChoices: false },
  CHOICE: { id: 'choice', name: 'Choice', hasChoices: true },
  BRANCH: { id: 'branch', name: 'Branch', hasChoices: false },
  ACTION: { id: 'action', name: 'Action', hasChoices: false },
  END: { id: 'end', name: 'End', hasChoices: false }
};

// Speaker types
export const SPEAKER_TYPES = {
  NPC: { id: 'npc', name: 'NPC' },
  PLAYER: { id: 'player', name: 'Player' },
  NARRATOR: { id: 'narrator', name: 'Narrator' },
  SYSTEM: { id: 'system', name: 'System' }
};

// Emotion types for portraits
export const EMOTIONS = {
  NEUTRAL: { id: 'neutral', name: 'Neutral' },
  HAPPY: { id: 'happy', name: 'Happy' },
  SAD: { id: 'sad', name: 'Sad' },
  ANGRY: { id: 'angry', name: 'Angry' },
  SURPRISED: { id: 'surprised', name: 'Surprised' },
  THINKING: { id: 'thinking', name: 'Thinking' },
  SCARED: { id: 'scared', name: 'Scared' },
  EXCITED: { id: 'excited', name: 'Excited' }
};

// Choice requirement types
export const REQUIREMENT_TYPES = {
  NONE: { id: 'none', name: 'None' },
  STAT: { id: 'stat', name: 'Stat Check' },
  ITEM: { id: 'item', name: 'Item Required' },
  QUEST: { id: 'quest', name: 'Quest State' },
  REPUTATION: { id: 'reputation', name: 'Reputation' },
  SKILL: { id: 'skill', name: 'Skill Level' }
};

/**
 * Get dialogue state from game state
 */
function getDialogueState(state) {
  return state.dialogue || {
    activeDialogue: null,
    currentNodeId: null,
    visitedNodes: [],
    choiceHistory: [],
    variables: {},
    completedDialogues: [],
    stats: {
      dialoguesStarted: 0,
      dialoguesCompleted: 0,
      choicesMade: 0
    }
  };
}

/**
 * Initialize dialogue state
 */
export function initDialogueState(state) {
  return {
    state: {
      ...state,
      dialogue: {
        activeDialogue: null,
        currentNodeId: null,
        visitedNodes: [],
        choiceHistory: [],
        variables: {},
        completedDialogues: [],
        stats: {
          dialoguesStarted: 0,
          dialoguesCompleted: 0,
          choicesMade: 0
        }
      }
    },
    success: true
  };
}

/**
 * Create a dialogue tree
 */
export function createDialogue(dialogueId, speakerId, nodes = []) {
  if (!dialogueId || !speakerId) {
    return { dialogue: null, error: 'Dialogue ID and speaker required' };
  }

  const dialogue = {
    id: dialogueId,
    speakerId,
    nodes: {},
    startNodeId: null,
    createdAt: Date.now()
  };

  // Index nodes by ID
  nodes.forEach((node, index) => {
    const nodeId = node.id || `node_${index}`;
    dialogue.nodes[nodeId] = {
      ...node,
      id: nodeId
    };
    if (index === 0) {
      dialogue.startNodeId = nodeId;
    }
  });

  return { dialogue, success: true };
}

/**
 * Create a dialogue node
 */
export function createNode(options = {}) {
  const {
    id,
    type = 'text',
    speaker = 'npc',
    text = '',
    emotion = 'neutral',
    choices = [],
    nextNodeId = null,
    conditions = null,
    actions = null
  } = options;

  return {
    id: id || `node_${Date.now()}`,
    type,
    speaker,
    text,
    emotion,
    choices,
    nextNodeId,
    conditions,
    actions
  };
}

/**
 * Create a dialogue choice
 */
export function createChoice(options = {}) {
  const {
    id,
    text = '',
    nextNodeId = null,
    requirement = null,
    consequence = null,
    hidden = false
  } = options;

  return {
    id: id || `choice_${Date.now()}`,
    text,
    nextNodeId,
    requirement,
    consequence,
    hidden
  };
}

/**
 * Start a dialogue
 */
export function startDialogue(state, dialogue) {
  if (!dialogue || !dialogue.id) {
    return { state, success: false, error: 'Invalid dialogue' };
  }

  const dialogueState = getDialogueState(state);

  if (dialogueState.activeDialogue) {
    return { state, success: false, error: 'Dialogue already active' };
  }

  const startNode = dialogue.nodes[dialogue.startNodeId];
  if (!startNode) {
    return { state, success: false, error: 'Start node not found' };
  }

  return {
    state: {
      ...state,
      dialogue: {
        ...dialogueState,
        activeDialogue: dialogue,
        currentNodeId: dialogue.startNodeId,
        visitedNodes: [dialogue.startNodeId],
        choiceHistory: [],
        stats: {
          ...dialogueState.stats,
          dialoguesStarted: dialogueState.stats.dialoguesStarted + 1
        }
      }
    },
    success: true,
    node: startNode
  };
}

/**
 * Get current dialogue node
 */
export function getCurrentNode(state) {
  const dialogueState = getDialogueState(state);

  if (!dialogueState.activeDialogue || !dialogueState.currentNodeId) {
    return { node: null, active: false };
  }

  const node = dialogueState.activeDialogue.nodes[dialogueState.currentNodeId];

  return {
    node,
    active: true,
    dialogue: dialogueState.activeDialogue
  };
}

/**
 * Advance to next node
 */
export function advanceDialogue(state, nextNodeId = null) {
  const dialogueState = getDialogueState(state);

  if (!dialogueState.activeDialogue) {
    return { state, success: false, error: 'No active dialogue' };
  }

  const currentNode = dialogueState.activeDialogue.nodes[dialogueState.currentNodeId];
  
  // Determine next node
  const targetNodeId = nextNodeId || currentNode.nextNodeId;

  if (!targetNodeId) {
    // End of dialogue
    return endDialogue(state);
  }

  const nextNode = dialogueState.activeDialogue.nodes[targetNodeId];
  if (!nextNode) {
    return { state, success: false, error: 'Next node not found' };
  }

  // Check if this is an end node
  if (nextNode.type === 'end') {
    return endDialogue(state);
  }

  return {
    state: {
      ...state,
      dialogue: {
        ...dialogueState,
        currentNodeId: targetNodeId,
        visitedNodes: [...dialogueState.visitedNodes, targetNodeId]
      }
    },
    success: true,
    node: nextNode
  };
}

/**
 * Make a choice in dialogue
 */
export function makeChoice(state, choiceId) {
  const dialogueState = getDialogueState(state);

  if (!dialogueState.activeDialogue) {
    return { state, success: false, error: 'No active dialogue' };
  }

  const currentNode = dialogueState.activeDialogue.nodes[dialogueState.currentNodeId];
  
  if (currentNode.type !== 'choice') {
    return { state, success: false, error: 'Current node is not a choice node' };
  }

  const choice = currentNode.choices.find(c => c.id === choiceId);
  if (!choice) {
    return { state, success: false, error: 'Choice not found' };
  }

  // Record choice
  const choiceEntry = {
    nodeId: dialogueState.currentNodeId,
    choiceId,
    timestamp: Date.now()
  };

  const updatedState = {
    ...state,
    dialogue: {
      ...dialogueState,
      choiceHistory: [...dialogueState.choiceHistory, choiceEntry],
      stats: {
        ...dialogueState.stats,
        choicesMade: dialogueState.stats.choicesMade + 1
      }
    }
  };

  // Apply any consequences
  if (choice.consequence) {
    // Could trigger reputation changes, item transfers, etc.
    updatedState.dialogue.variables = {
      ...updatedState.dialogue.variables,
      ...choice.consequence
    };
  }

  // Advance to next node
  if (choice.nextNodeId) {
    return advanceDialogue(updatedState, choice.nextNodeId);
  }

  return {
    state: updatedState,
    success: true,
    choice
  };
}

/**
 * End current dialogue
 */
export function endDialogue(state) {
  const dialogueState = getDialogueState(state);

  if (!dialogueState.activeDialogue) {
    return { state, success: true, wasActive: false };
  }

  const dialogueId = dialogueState.activeDialogue.id;

  return {
    state: {
      ...state,
      dialogue: {
        ...dialogueState,
        activeDialogue: null,
        currentNodeId: null,
        visitedNodes: [],
        completedDialogues: [...dialogueState.completedDialogues, dialogueId],
        stats: {
          ...dialogueState.stats,
          dialoguesCompleted: dialogueState.stats.dialoguesCompleted + 1
        }
      }
    },
    success: true,
    wasActive: true,
    dialogueId
  };
}

/**
 * Check if choice requirement is met
 */
export function checkRequirement(state, requirement, playerStats = {}) {
  if (!requirement) {
    return { met: true };
  }

  const { type, stat, value, itemId, questId, factionId, skillId } = requirement;

  switch (type) {
    case 'stat':
      const playerStat = playerStats[stat] || 0;
      return { met: playerStat >= value, current: playerStat, required: value };
    
    case 'item':
      const hasItem = playerStats.inventory?.includes(itemId);
      return { met: hasItem, itemId };
    
    case 'quest':
      const questComplete = playerStats.completedQuests?.includes(questId);
      return { met: questComplete, questId };
    
    case 'reputation':
      const rep = playerStats.reputation?.[factionId] || 0;
      return { met: rep >= value, current: rep, required: value };
    
    case 'skill':
      const skill = playerStats.skills?.[skillId] || 0;
      return { met: skill >= value, current: skill, required: value };
    
    default:
      return { met: true };
  }
}

/**
 * Get available choices for current node
 */
export function getAvailableChoices(state, playerStats = {}) {
  const { node, active } = getCurrentNode(state);

  if (!active || node.type !== 'choice') {
    return { choices: [], hasChoices: false };
  }

  const availableChoices = node.choices
    .filter(choice => !choice.hidden)
    .map(choice => {
      const reqCheck = checkRequirement(state, choice.requirement, playerStats);
      return {
        ...choice,
        available: reqCheck.met,
        requirementInfo: reqCheck
      };
    });

  return {
    choices: availableChoices,
    hasChoices: availableChoices.length > 0
  };
}

/**
 * Set dialogue variable
 */
export function setVariable(state, key, value) {
  const dialogueState = getDialogueState(state);

  return {
    state: {
      ...state,
      dialogue: {
        ...dialogueState,
        variables: {
          ...dialogueState.variables,
          [key]: value
        }
      }
    },
    success: true,
    key,
    value
  };
}

/**
 * Get dialogue variable
 */
export function getVariable(state, key) {
  const dialogueState = getDialogueState(state);
  return dialogueState.variables[key];
}

/**
 * Check if dialogue was completed
 */
export function wasDialogueCompleted(state, dialogueId) {
  const dialogueState = getDialogueState(state);
  return dialogueState.completedDialogues.includes(dialogueId);
}

/**
 * Get dialogue stats
 */
export function getDialogueStats(state) {
  const dialogueState = getDialogueState(state);
  return {
    ...dialogueState.stats,
    completedCount: dialogueState.completedDialogues.length
  };
}

/**
 * Check if dialogue is active
 */
export function isDialogueActive(state) {
  const dialogueState = getDialogueState(state);
  return dialogueState.activeDialogue !== null;
}

/**
 * Get choice history
 */
export function getChoiceHistory(state) {
  const dialogueState = getDialogueState(state);
  return [...dialogueState.choiceHistory];
}
