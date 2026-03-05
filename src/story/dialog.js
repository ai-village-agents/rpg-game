/**
 * Dialog System for NPC conversations
 * Supports branching dialog trees with conditions and effects
 */

export const DialogState = {
  INACTIVE: 'inactive',
  ACTIVE: 'active',
  AWAITING_CHOICE: 'awaiting-choice',
};

/**
 * Creates a new dialog state tracker
 */
export function createDialogState() {
  return {
    status: DialogState.INACTIVE,
    currentDialogId: null,
    currentNodeId: null,
    history: [],
  };
}

/**
 * Starts a dialog with an NPC
 * @param {Object} dialogState - Current dialog state
 * @param {Object} dialog - Dialog tree data
 * @returns {Object} Updated state and current node
 */
export function startDialog(dialogState, dialog) {
  if (!dialog || !dialog.startNode) {
    return { state: dialogState, node: null };
  }

  const node = dialog.nodes[dialog.startNode];
  const newState = {
    ...dialogState,
    status: node.choices ? DialogState.AWAITING_CHOICE : DialogState.ACTIVE,
    currentDialogId: dialog.id,
    currentNodeId: dialog.startNode,
    history: [...dialogState.history, { dialogId: dialog.id, nodeId: dialog.startNode }],
  };

  return { state: newState, node };
}

/**
 * Advances dialog by selecting a choice
 * @param {Object} dialogState - Current dialog state
 * @param {Object} dialog - Dialog tree data
 * @param {number} choiceIndex - Index of selected choice
 * @param {Object} gameState - Current game state for condition checks
 * @returns {Object} Updated state, node, and any effects
 */
export function selectChoice(dialogState, dialog, choiceIndex, gameState = {}) {
  if (dialogState.status !== DialogState.AWAITING_CHOICE) {
    return { state: dialogState, node: null, effects: [] };
  }

  const currentNode = dialog.nodes[dialogState.currentNodeId];
  if (!currentNode || !currentNode.choices || !currentNode.choices[choiceIndex]) {
    return { state: dialogState, node: null, effects: [] };
  }

  const choice = currentNode.choices[choiceIndex];

  // Check if choice has conditions
  if (choice.condition && !evaluateCondition(choice.condition, gameState)) {
    return { state: dialogState, node: null, effects: [] };
  }

  const effects = choice.effects || [];

  // Check if this ends the dialog
  if (choice.nextNode === null || choice.nextNode === 'end') {
    return {
      state: { ...dialogState, status: DialogState.INACTIVE, currentNodeId: null },
      node: null,
      effects,
    };
  }

  const nextNode = dialog.nodes[choice.nextNode];
  if (!nextNode) {
    return {
      state: { ...dialogState, status: DialogState.INACTIVE, currentNodeId: null },
      node: null,
      effects,
    };
  }

  const newState = {
    ...dialogState,
    status: nextNode.choices ? DialogState.AWAITING_CHOICE : DialogState.ACTIVE,
    currentNodeId: choice.nextNode,
    history: [...dialogState.history, { dialogId: dialog.id, nodeId: choice.nextNode }],
  };

  return { state: newState, node: nextNode, effects };
}

/**
 * Continues to next node (for nodes without choices)
 * @param {Object} dialogState - Current dialog state
 * @param {Object} dialog - Dialog tree data
 * @returns {Object} Updated state and node
 */
export function continueDialog(dialogState, dialog) {
  if (dialogState.status !== DialogState.ACTIVE) {
    return { state: dialogState, node: null };
  }

  const currentNode = dialog.nodes[dialogState.currentNodeId];
  if (!currentNode || !currentNode.nextNode) {
    return {
      state: { ...dialogState, status: DialogState.INACTIVE, currentNodeId: null },
      node: null,
    };
  }

  if (currentNode.nextNode === 'end') {
    return {
      state: { ...dialogState, status: DialogState.INACTIVE, currentNodeId: null },
      node: null,
    };
  }

  const nextNode = dialog.nodes[currentNode.nextNode];
  if (!nextNode) {
    return {
      state: { ...dialogState, status: DialogState.INACTIVE, currentNodeId: null },
      node: null,
    };
  }

  const newState = {
    ...dialogState,
    status: nextNode.choices ? DialogState.AWAITING_CHOICE : DialogState.ACTIVE,
    currentNodeId: currentNode.nextNode,
    history: [...dialogState.history, { dialogId: dialog.id, nodeId: currentNode.nextNode }],
  };

  return { state: newState, node: nextNode };
}

/**
 * Ends the current dialog
 */
export function endDialog(dialogState) {
  return {
    ...dialogState,
    status: DialogState.INACTIVE,
    currentDialogId: null,
    currentNodeId: null,
  };
}

/**
 * Evaluates a condition against game state
 * @param {Object} condition - Condition to check
 * @param {Object} gameState - Current game state
 * @returns {boolean} Whether condition is met
 */
export function evaluateCondition(condition, gameState) {
  if (!condition) return true;

  const { type, key, value, operator = 'eq' } = condition;

  let actualValue;
  if (type === 'quest') {
    actualValue = gameState.quests?.[key]?.status;
  } else if (type === 'flag') {
    actualValue = gameState.flags?.[key];
  } else if (type === 'item') {
    actualValue = gameState.inventory?.some(item => item.id === key);
  } else if (type === 'stat') {
    actualValue = gameState.player?.[key];
  } else {
    return true;
  }

  switch (operator) {
    case 'eq': return actualValue === value;
    case 'neq': return actualValue !== value;
    case 'gt': return actualValue > value;
    case 'gte': return actualValue >= value;
    case 'lt': return actualValue < value;
    case 'lte': return actualValue <= value;
    case 'has': return Boolean(actualValue);
    case 'not': return !actualValue;
    default: return actualValue === value;
  }
}

/**
 * Gets available choices for current node, filtering by conditions
 * @param {Object} node - Current dialog node
 * @param {Object} gameState - Current game state
 * @returns {Array} Available choices
 */
export function getAvailableChoices(node, gameState = {}) {
  if (!node || !node.choices) return [];

  return node.choices.filter(choice => {
    if (!choice.condition) return true;
    return evaluateCondition(choice.condition, gameState);
  });
}

/**
 * Checks if an NPC has dialog available in current context
 * @param {Object} npc - NPC data with dialogs array
 * @param {Object} gameState - Current game state
 * @returns {Object|null} Available dialog or null
 */
export function getAvailableDialog(npc, gameState = {}) {
  if (!npc || !npc.dialogs) return null;

  for (const dialogRef of npc.dialogs) {
    if (dialogRef.condition && !evaluateCondition(dialogRef.condition, gameState)) {
      continue;
    }
    return dialogRef.dialog;
  }

  return npc.defaultDialog || null;
}
