/**
 * Dialog Module — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Provides dialog tree system for NPC conversations.
 * Supports branching dialogs, choices, conditions, and triggers.
 */

// ── Dialog Node Types ────────────────────────────────────────────────
const DialogNodeType = {
  TEXT: 'text',           // Simple text display
  CHOICE: 'choice',       // Player chooses from options
  CONDITIONAL: 'conditional', // Branch based on game state
  ACTION: 'action',       // Trigger game action (give item, start quest, etc.)
  END: 'end'             // End of dialog
};

// ── Dialog Manager Class ─────────────────────────────────────────────
class DialogManager {
  constructor() {
    this.dialogs = new Map();      // All registered dialog trees
    this.currentDialog = null;     // Active dialog ID
    this.currentNodeId = null;     // Current node in active dialog
    this.dialogHistory = [];       // History of visited nodes (for back navigation)
    this.onDialogStart = null;     // Callback when dialog starts
    this.onNodeChange = null;      // Callback when node changes
    this.onDialogEnd = null;       // Callback when dialog ends
    this.onAction = null;          // Callback for action nodes
  }

  /**
   * Register a dialog tree
   * @param {string} dialogId - Unique dialog identifier
   * @param {Object} dialogTree - The dialog tree structure
   */
  registerDialog(dialogId, dialogTree) {
    if (!dialogTree || !dialogTree.startNode || !dialogTree.nodes) {
      console.error(`Invalid dialog tree for "${dialogId}"`);
      return false;
    }
    this.dialogs.set(dialogId, dialogTree);
    return true;
  }

  /**
   * Start a dialog by ID
   * @param {string} dialogId - The dialog to start
   * @param {Object} gameState - Current game state for conditions
   * @returns {Object|null} The first dialog node or null if invalid
   */
  startDialog(dialogId, gameState = {}) {
    const dialog = this.dialogs.get(dialogId);
    if (!dialog) {
      console.error(`Dialog "${dialogId}" not found`);
      return null;
    }

    this.currentDialog = dialogId;
    this.dialogHistory = [];
    
    const startNode = dialog.nodes[dialog.startNode];
    if (!startNode) {
      console.error(`Start node "${dialog.startNode}" not found in dialog "${dialogId}"`);
      return null;
    }

    this.currentNodeId = dialog.startNode;
    
    if (this.onDialogStart) {
      this.onDialogStart(dialogId, startNode);
    }

    return this.processNode(startNode, gameState);
  }

  /**
   * Process a dialog node (handle conditionals, actions)
   * @param {Object} node - The node to process
   * @param {Object} gameState - Current game state
   * @returns {Object} Processed node data for rendering
   */
  processNode(node, gameState = {}) {
    if (!node) return null;

    switch (node.type) {
      case DialogNodeType.CONDITIONAL:
        return this.processConditionalNode(node, gameState);
      
      case DialogNodeType.ACTION:
        return this.processActionNode(node, gameState);
      
      case DialogNodeType.TEXT:
      case DialogNodeType.CHOICE:
        return {
          type: node.type,
          speaker: node.speaker || 'Unknown',
          text: node.text || '',
          portrait: node.portrait || null,
          choices: node.choices || null,
          autoAdvance: node.autoAdvance || false,
          delay: node.delay || 0
        };
      
      case DialogNodeType.END:
        this.endDialog();
        return { type: 'end' };
      
      default:
        return node;
    }
  }

  /**
   * Process a conditional node - evaluate and jump to appropriate branch
   */
  processConditionalNode(node, gameState) {
    for (const condition of (node.conditions || [])) {
      if (this.evaluateCondition(condition.check, gameState)) {
        return this.goToNode(condition.then, gameState);
      }
    }
    // Default/else branch
    if (node.else) {
      return this.goToNode(node.else, gameState);
    }
    return this.endDialog();
  }

  /**
   * Process an action node - trigger action and continue
   */
  processActionNode(node, gameState) {
    if (this.onAction && node.action) {
      this.onAction(node.action, node.params || {});
    }
    // Auto-advance to next node
    if (node.next) {
      return this.goToNode(node.next, gameState);
    }
    return this.endDialog();
  }

  /**
   * Evaluate a condition against game state
   * @param {Object} condition - Condition to check
   * @param {Object} gameState - Current game state
   * @returns {boolean}
   */
  evaluateCondition(condition, gameState) {
    if (!condition) return false;

    const { type, key, value, operator = '==' } = condition;

    switch (type) {
      case 'quest':
        const questStatus = gameState.quests?.[key];
        return this.compare(questStatus, value, operator);
      
      case 'item':
        const hasItem = gameState.inventory?.includes(key);
        return value ? hasItem : !hasItem;
      
      case 'flag':
        const flagValue = gameState.flags?.[key];
        return this.compare(flagValue, value, operator);
      
      case 'stat':
        const statValue = gameState.stats?.[key];
        return this.compare(statValue, value, operator);
      
      case 'gold':
        const gold = gameState.gold || 0;
        return this.compare(gold, value, operator);
      
      default:
        return false;
    }
  }

  /**
   * Compare two values with an operator
   */
  compare(a, b, operator) {
    switch (operator) {
      case '==': return a === b;
      case '!=': return a !== b;
      case '>': return a > b;
      case '>=': return a >= b;
      case '<': return a < b;
      case '<=': return a <= b;
      default: return a === b;
    }
  }

  /**
   * Select a choice and advance dialog
   * @param {number} choiceIndex - Index of chosen option
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Next node or null
   */
  selectChoice(choiceIndex, gameState = {}) {
    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return null;

    const currentNode = dialog.nodes[this.currentNodeId];
    if (!currentNode || currentNode.type !== DialogNodeType.CHOICE) {
      return null;
    }

    const choice = currentNode.choices?.[choiceIndex];
    if (!choice) return null;

    // Save to history for potential back navigation
    this.dialogHistory.push(this.currentNodeId);

    // Process any choice-specific action
    if (choice.action && this.onAction) {
      this.onAction(choice.action, choice.params || {});
    }

    // Go to next node
    if (choice.next) {
      return this.goToNode(choice.next, gameState);
    }

    return this.endDialog();
  }

  /**
   * Advance to next node (for non-choice nodes)
   * @param {Object} gameState - Current game state
   * @returns {Object|null}
   */
  advanceDialog(gameState = {}) {
    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return null;

    const currentNode = dialog.nodes[this.currentNodeId];
    if (!currentNode) return null;

    // Don't auto-advance choice nodes
    if (currentNode.type === DialogNodeType.CHOICE) {
      return null;
    }

    this.dialogHistory.push(this.currentNodeId);

    if (currentNode.next) {
      return this.goToNode(currentNode.next, gameState);
    }

    return this.endDialog();
  }

  /**
   * Navigate to a specific node
   */
  goToNode(nodeId, gameState = {}) {
    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return null;

    const node = dialog.nodes[nodeId];
    if (!node) {
      console.error(`Node "${nodeId}" not found`);
      return this.endDialog();
    }

    this.currentNodeId = nodeId;

    if (this.onNodeChange) {
      this.onNodeChange(nodeId, node);
    }

    return this.processNode(node, gameState);
  }

  /**
   * End the current dialog
   */
  endDialog() {
    const dialogId = this.currentDialog;
    
    this.currentDialog = null;
    this.currentNodeId = null;
    this.dialogHistory = [];

    if (this.onDialogEnd) {
      this.onDialogEnd(dialogId);
    }

    return { type: 'end', dialogId };
  }

  /**
   * Check if a dialog is currently active
   */
  isDialogActive() {
    return this.currentDialog !== null;
  }

  /**
   * Get current dialog state (for saving)
   */
  getState() {
    return {
      currentDialog: this.currentDialog,
      currentNodeId: this.currentNodeId,
      dialogHistory: [...this.dialogHistory]
    };
  }

  /**
   * Restore dialog state (for loading)
   */
  restoreState(state, gameState = {}) {
    if (!state || !state.currentDialog) return null;

    this.currentDialog = state.currentDialog;
    this.currentNodeId = state.currentNodeId;
    this.dialogHistory = state.dialogHistory || [];

    const dialog = this.dialogs.get(this.currentDialog);
    if (!dialog) return null;

    const node = dialog.nodes[this.currentNodeId];
    return this.processNode(node, gameState);
  }
}

// ── Factory Functions ────────────────────────────────────────────────

/**
 * Create a new DialogManager instance
 */
function createDialogManager() {
  return new DialogManager();
}

/**
 * Create a dialog tree structure
 * @param {string} startNode - ID of the starting node
 * @param {Object} nodes - Map of node IDs to node objects
 * @returns {Object} Dialog tree
 */
function createDialogTree(startNode, nodes) {
  return { startNode, nodes };
}

/**
 * Create a text node
 */
function textNode(speaker, text, options = {}) {
  return {
    type: DialogNodeType.TEXT,
    speaker,
    text,
    portrait: options.portrait || null,
    next: options.next || null,
    autoAdvance: options.autoAdvance || false,
    delay: options.delay || 0
  };
}

/**
 * Create a choice node
 */
function choiceNode(speaker, text, choices, options = {}) {
  return {
    type: DialogNodeType.CHOICE,
    speaker,
    text,
    portrait: options.portrait || null,
    choices: choices.map(c => ({
      text: c.text,
      next: c.next,
      action: c.action || null,
      params: c.params || {}
    }))
  };
}

/**
 * Create a conditional node
 */
function conditionalNode(conditions, elseNode = null) {
  return {
    type: DialogNodeType.CONDITIONAL,
    conditions: conditions.map(c => ({
      check: c.check,
      then: c.then
    })),
    else: elseNode
  };
}

/**
 * Create an action node
 */
function actionNode(action, params = {}, nextNode = null) {
  return {
    type: DialogNodeType.ACTION,
    action,
    params,
    next: nextNode
  };
}

/**
 * Create an end node
 */
function endNode() {
  return { type: DialogNodeType.END };
}

// ── Exports ──────────────────────────────────────────────────────────
export {
  DialogManager,
  DialogNodeType,
  createDialogManager,
  createDialogTree,
  textNode,
  choiceNode,
  conditionalNode,
  actionNode,
  endNode
};
