/**
 * Dialogue System
 * NPC conversations with branching choices and conditions
 */

// Dialogue node types
export const NODE_TYPES = {
  TEXT: 'text',
  CHOICE: 'choice',
  BRANCH: 'branch',
  ACTION: 'action',
  END: 'end'
};

// Condition types
export const CONDITION_TYPES = {
  QUEST_COMPLETE: 'quest_complete',
  QUEST_ACTIVE: 'quest_active',
  ITEM_HAS: 'item_has',
  LEVEL_MIN: 'level_min',
  REPUTATION_MIN: 'reputation_min',
  FLAG_SET: 'flag_set',
  STAT_MIN: 'stat_min'
};

// Action types
export const ACTION_TYPES = {
  GIVE_ITEM: 'give_item',
  TAKE_ITEM: 'take_item',
  GIVE_GOLD: 'give_gold',
  TAKE_GOLD: 'take_gold',
  START_QUEST: 'start_quest',
  COMPLETE_QUEST: 'complete_quest',
  SET_FLAG: 'set_flag',
  ADD_REPUTATION: 'add_reputation',
  OPEN_SHOP: 'open_shop'
};

// Create initial dialogue state
export function createDialogueState() {
  return {
    activeDialogue: null,
    currentNode: null,
    history: [],
    flags: {},
    npcStates: {},
    stats: {
      conversationsStarted: 0,
      conversationsCompleted: 0,
      choicesMade: 0
    }
  };
}

// Create a dialogue definition
export function createDialogue(id, npcId, nodes, startNodeId) {
  if (!id || !npcId) {
    return { success: false, error: 'Invalid dialogue id or npc id' };
  }

  if (!nodes || Object.keys(nodes).length === 0) {
    return { success: false, error: 'Dialogue must have at least one node' };
  }

  if (!nodes[startNodeId]) {
    return { success: false, error: 'Start node not found' };
  }

  return {
    success: true,
    dialogue: {
      id,
      npcId,
      nodes,
      startNodeId,
      createdAt: Date.now()
    }
  };
}

// Create a text node
export function createTextNode(id, text, nextNodeId) {
  return {
    id,
    type: NODE_TYPES.TEXT,
    text,
    next: nextNodeId
  };
}

// Create a choice node
export function createChoiceNode(id, text, choices) {
  return {
    id,
    type: NODE_TYPES.CHOICE,
    text,
    choices: choices.map(choice => ({
      text: choice.text,
      next: choice.next,
      conditions: choice.conditions || [],
      actions: choice.actions || []
    }))
  };
}

// Create a branch node (conditional)
export function createBranchNode(id, branches, defaultNext) {
  return {
    id,
    type: NODE_TYPES.BRANCH,
    branches: branches.map(branch => ({
      conditions: branch.conditions,
      next: branch.next
    })),
    default: defaultNext
  };
}

// Create an action node
export function createActionNode(id, actions, nextNodeId) {
  return {
    id,
    type: NODE_TYPES.ACTION,
    actions,
    next: nextNodeId
  };
}

// Create an end node
export function createEndNode(id) {
  return {
    id,
    type: NODE_TYPES.END
  };
}

// Create dialogue registry
export function createDialogueRegistry() {
  return {
    dialogues: {},
    byNpc: {}
  };
}

// Register dialogue
export function registerDialogue(registry, dialogue) {
  if (!dialogue || !dialogue.id) {
    return { success: false, error: 'Invalid dialogue' };
  }

  if (registry.dialogues[dialogue.id]) {
    return { success: false, error: 'Dialogue already registered' };
  }

  const newDialogues = { ...registry.dialogues, [dialogue.id]: dialogue };

  const newByNpc = { ...registry.byNpc };
  newByNpc[dialogue.npcId] = [...(newByNpc[dialogue.npcId] || []), dialogue.id];

  return {
    success: true,
    registry: {
      dialogues: newDialogues,
      byNpc: newByNpc
    }
  };
}

// Check if condition is met
export function checkCondition(condition, gameState = {}) {
  const { type, target, value } = condition;

  switch (type) {
    case CONDITION_TYPES.QUEST_COMPLETE:
      return gameState.completedQuests?.includes(target);

    case CONDITION_TYPES.QUEST_ACTIVE:
      return gameState.activeQuests?.includes(target);

    case CONDITION_TYPES.ITEM_HAS:
      return (gameState.inventory?.[target] || 0) >= (value || 1);

    case CONDITION_TYPES.LEVEL_MIN:
      return (gameState.level || 1) >= value;

    case CONDITION_TYPES.REPUTATION_MIN:
      return (gameState.reputation?.[target] || 0) >= value;

    case CONDITION_TYPES.FLAG_SET:
      return !!gameState.flags?.[target];

    case CONDITION_TYPES.STAT_MIN:
      return (gameState.stats?.[target] || 0) >= value;

    default:
      return true;
  }
}

// Check if all conditions are met
export function checkConditions(conditions, gameState = {}) {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every(cond => checkCondition(cond, gameState));
}

// Start dialogue
export function startDialogue(state, registry, dialogueId, gameState = {}) {
  const dialogue = registry.dialogues[dialogueId];
  if (!dialogue) {
    return { success: false, error: 'Dialogue not found' };
  }

  if (state.activeDialogue) {
    return { success: false, error: 'Dialogue already active' };
  }

  const startNode = dialogue.nodes[dialogue.startNodeId];

  const historyEntry = {
    dialogueId,
    npcId: dialogue.npcId,
    startedAt: Date.now()
  };

  return {
    success: true,
    node: startNode,
    state: {
      ...state,
      activeDialogue: dialogueId,
      currentNode: dialogue.startNodeId,
      history: [...state.history.slice(-49), historyEntry],
      stats: {
        ...state.stats,
        conversationsStarted: state.stats.conversationsStarted + 1
      }
    }
  };
}

// Get current node
export function getCurrentNode(state, registry) {
  if (!state.activeDialogue || !state.currentNode) {
    return null;
  }

  const dialogue = registry.dialogues[state.activeDialogue];
  if (!dialogue) return null;

  return dialogue.nodes[state.currentNode];
}

// Get available choices
export function getAvailableChoices(node, gameState = {}) {
  if (node.type !== NODE_TYPES.CHOICE) {
    return [];
  }

  return node.choices
    .map((choice, index) => ({
      index,
      text: choice.text,
      available: checkConditions(choice.conditions, gameState)
    }))
    .filter(choice => choice.available);
}

// Advance dialogue
export function advanceDialogue(state, registry, gameState = {}) {
  const node = getCurrentNode(state, registry);
  if (!node) {
    return { success: false, error: 'No active dialogue' };
  }

  if (node.type === NODE_TYPES.END) {
    return endDialogue(state);
  }

  if (node.type === NODE_TYPES.CHOICE) {
    return { success: false, error: 'Must select a choice' };
  }

  let nextNodeId = null;
  let actions = [];

  switch (node.type) {
    case NODE_TYPES.TEXT:
      nextNodeId = node.next;
      break;

    case NODE_TYPES.BRANCH:
      for (const branch of node.branches) {
        if (checkConditions(branch.conditions, gameState)) {
          nextNodeId = branch.next;
          break;
        }
      }
      if (!nextNodeId) {
        nextNodeId = node.default;
      }
      break;

    case NODE_TYPES.ACTION:
      actions = node.actions || [];
      nextNodeId = node.next;
      break;
  }

  if (!nextNodeId) {
    return endDialogue(state);
  }

  const dialogue = registry.dialogues[state.activeDialogue];
  const nextNode = dialogue.nodes[nextNodeId];

  if (!nextNode) {
    return endDialogue(state);
  }

  return {
    success: true,
    node: nextNode,
    actions,
    state: {
      ...state,
      currentNode: nextNodeId
    }
  };
}

// Select choice
export function selectChoice(state, registry, choiceIndex, gameState = {}) {
  const node = getCurrentNode(state, registry);
  if (!node) {
    return { success: false, error: 'No active dialogue' };
  }

  if (node.type !== NODE_TYPES.CHOICE) {
    return { success: false, error: 'Current node is not a choice node' };
  }

  if (choiceIndex < 0 || choiceIndex >= node.choices.length) {
    return { success: false, error: 'Invalid choice index' };
  }

  const choice = node.choices[choiceIndex];

  if (!checkConditions(choice.conditions, gameState)) {
    return { success: false, error: 'Choice conditions not met' };
  }

  const dialogue = registry.dialogues[state.activeDialogue];
  const nextNode = dialogue.nodes[choice.next];

  if (!nextNode) {
    return endDialogue(state);
  }

  return {
    success: true,
    node: nextNode,
    actions: choice.actions || [],
    chosenText: choice.text,
    state: {
      ...state,
      currentNode: choice.next,
      stats: {
        ...state.stats,
        choicesMade: state.stats.choicesMade + 1
      }
    }
  };
}

// End dialogue
export function endDialogue(state) {
  if (!state.activeDialogue) {
    return { success: false, error: 'No active dialogue' };
  }

  return {
    success: true,
    state: {
      ...state,
      activeDialogue: null,
      currentNode: null,
      stats: {
        ...state.stats,
        conversationsCompleted: state.stats.conversationsCompleted + 1
      }
    }
  };
}

// Set dialogue flag
export function setDialogueFlag(state, flag, value = true) {
  return {
    ...state,
    flags: {
      ...state.flags,
      [flag]: value
    }
  };
}

// Get dialogue flag
export function getDialogueFlag(state, flag) {
  return state.flags[flag] || false;
}

// Set NPC state
export function setNpcState(state, npcId, npcState) {
  return {
    ...state,
    npcStates: {
      ...state.npcStates,
      [npcId]: {
        ...(state.npcStates[npcId] || {}),
        ...npcState
      }
    }
  };
}

// Get NPC state
export function getNpcState(state, npcId) {
  return state.npcStates[npcId] || {};
}

// Get dialogues for NPC
export function getDialoguesForNpc(registry, npcId) {
  const dialogueIds = registry.byNpc[npcId] || [];
  return dialogueIds.map(id => registry.dialogues[id]);
}

// Get best dialogue for NPC (based on conditions)
export function getBestDialogueForNpc(registry, npcId, gameState = {}) {
  const dialogues = getDialoguesForNpc(registry, npcId);

  for (const dialogue of dialogues) {
    const startNode = dialogue.nodes[dialogue.startNodeId];
    if (startNode.conditions && !checkConditions(startNode.conditions, gameState)) {
      continue;
    }
    return dialogue;
  }

  return dialogues[0] || null;
}

// Get dialogue stats
export function getDialogueStats(state) {
  return {
    ...state.stats,
    flagsSet: Object.keys(state.flags).length,
    historyLength: state.history.length,
    isInDialogue: state.activeDialogue !== null
  };
}

// Get conversation history
export function getConversationHistory(state, limit = 10) {
  return state.history.slice(-limit).reverse();
}

// Create condition helper
export function createCondition(type, target, value = null) {
  return { type, target, value };
}

// Create action helper
export function createAction(type, target, value = null) {
  return { type, target, value };
}

// Process dialogue actions
export function processActions(actions, gameState = {}) {
  if (!actions || !Array.isArray(actions)) return [];

  const results = [];

  for (const action of actions) {
    const result = { type: action.type, target: action.target, value: action.value };

    switch (action.type) {
      case ACTION_TYPES.GIVE_ITEM:
        result.description = `Received ${action.value || 1}x ${action.target}`;
        break;
      case ACTION_TYPES.TAKE_ITEM:
        result.description = `Lost ${action.value || 1}x ${action.target}`;
        break;
      case ACTION_TYPES.GIVE_GOLD:
        result.description = `Received ${action.value} gold`;
        break;
      case ACTION_TYPES.TAKE_GOLD:
        result.description = `Lost ${action.value} gold`;
        break;
      case ACTION_TYPES.START_QUEST:
        result.description = `Quest started: ${action.target}`;
        break;
      case ACTION_TYPES.COMPLETE_QUEST:
        result.description = `Quest completed: ${action.target}`;
        break;
      case ACTION_TYPES.SET_FLAG:
        result.description = `Flag set: ${action.target}`;
        break;
      case ACTION_TYPES.ADD_REPUTATION:
        result.description = `Reputation ${action.value >= 0 ? '+' : ''}${action.value} with ${action.target}`;
        break;
      case ACTION_TYPES.OPEN_SHOP:
        result.description = `Shop opened: ${action.target}`;
        break;
      default:
        result.description = `Action: ${action.type}`;
    }

    results.push(result);
  }

  return results;
}

// Check if NPC has dialogue
export function hasDialogue(registry, npcId) {
  return (registry.byNpc[npcId]?.length || 0) > 0;
}

// Get all NPC IDs with dialogues
export function getNpcsWithDialogue(registry) {
  return Object.keys(registry.byNpc);
}
