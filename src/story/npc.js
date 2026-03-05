/**
 * NPC Module — AI Village RPG
 * Owner: Claude Opus 4.5
 *
 * Provides NPC management, interaction handling, and behavior systems.
 * NPCs can have dialogs, quests, shops, and custom interactions.
 */

// ── NPC Types ────────────────────────────────────────────────────────
const NPCType = {
  QUEST_GIVER: 'quest_giver',
  MERCHANT: 'merchant',
  TRAINER: 'trainer',
  GUARD: 'guard',
  INNKEEPER: 'innkeeper',
  VILLAGER: 'villager',
  COMPANION: 'companion',
  BOSS: 'boss'
};

// ── NPC State ────────────────────────────────────────────────────────
const NPCState = {
  IDLE: 'idle',
  WALKING: 'walking',
  TALKING: 'talking',
  FOLLOWING: 'following',
  COMBAT: 'combat',
  DEAD: 'dead'
};

// ── NPC Manager Class ────────────────────────────────────────────────
class NPCManager {
  constructor() {
    this.npcDefinitions = new Map();   // NPC templates
    this.npcInstances = new Map();     // Active NPC instances
    this.npcsByLocation = new Map();   // NPCs indexed by location
    
    // Callbacks
    this.onInteract = null;
    this.onDialogStart = null;
    this.onShopOpen = null;
    this.onQuestOffer = null;
  }

  /**
   * Register an NPC definition
   */
  registerNPC(npcDef) {
    if (!npcDef || !npcDef.id) {
      console.error('Invalid NPC definition');
      return false;
    }
    this.npcDefinitions.set(npcDef.id, npcDef);
    return true;
  }

  /**
   * Register multiple NPCs
   */
  registerNPCs(npcs) {
    npcs.forEach(npc => this.registerNPC(npc));
  }

  /**
   * Spawn an NPC instance at a location
   */
  spawnNPC(npcId, location, options = {}) {
    const def = this.npcDefinitions.get(npcId);
    if (!def) {
      console.error(`NPC "${npcId}" not found`);
      return null;
    }

    const instanceId = options.instanceId || `${npcId}_${Date.now()}`;
    
    const instance = {
      instanceId,
      npcId,
      name: def.name,
      type: def.type,
      location,
      position: options.position || { x: 0, y: 0 },
      state: NPCState.IDLE,
      direction: options.direction || 'down',
      
      // State tracking
      interactionCount: 0,
      lastInteraction: null,
      flags: {},
      
      // Dynamic properties
      currentDialog: def.defaultDialog || null,
      currentShop: def.shop || null,
      quests: [...(def.quests || [])],
      
      // Visuals
      sprite: def.sprite || 'default_npc',
      portrait: def.portrait || null
    };

    this.npcInstances.set(instanceId, instance);
    
    // Index by location
    if (!this.npcsByLocation.has(location)) {
      this.npcsByLocation.set(location, new Set());
    }
    this.npcsByLocation.get(location).add(instanceId);

    return instance;
  }

  /**
   * Remove an NPC instance
   */
  despawnNPC(instanceId) {
    const instance = this.npcInstances.get(instanceId);
    if (!instance) return false;

    // Remove from location index
    const locationNpcs = this.npcsByLocation.get(instance.location);
    if (locationNpcs) {
      locationNpcs.delete(instanceId);
    }

    this.npcInstances.delete(instanceId);
    return true;
  }

  /**
   * Get NPC by instance ID
   */
  getNPC(instanceId) {
    return this.npcInstances.get(instanceId) || null;
  }

  /**
   * Get NPC definition
   */
  getNPCDefinition(npcId) {
    return this.npcDefinitions.get(npcId) || null;
  }

  /**
   * Get all NPCs at a location
   */
  getNPCsAtLocation(location) {
    const instanceIds = this.npcsByLocation.get(location);
    if (!instanceIds) return [];

    return Array.from(instanceIds)
      .map(id => this.npcInstances.get(id))
      .filter(npc => npc !== undefined);
  }

  /**
   * Get NPC at specific position (for collision/interaction)
   */
  getNPCAtPosition(location, x, y, radius = 1) {
    const npcs = this.getNPCsAtLocation(location);
    return npcs.find(npc => {
      const dx = Math.abs(npc.position.x - x);
      const dy = Math.abs(npc.position.y - y);
      return dx <= radius && dy <= radius;
    }) || null;
  }

  /**
   * Interact with an NPC
   * @param {string} instanceId - NPC instance ID
   * @param {Object} gameState - Current game state
   * @returns {Object} Interaction result
   */
  interact(instanceId, gameState = {}) {
    const instance = this.npcInstances.get(instanceId);
    if (!instance) return { success: false, error: 'NPC not found' };

    const def = this.npcDefinitions.get(instance.npcId);
    if (!def) return { success: false, error: 'NPC definition not found' };

    // Update interaction tracking
    instance.interactionCount++;
    instance.lastInteraction = Date.now();
    instance.state = NPCState.TALKING;

    // Determine interaction type based on NPC type and state
    const interaction = this.determineInteraction(instance, def, gameState);

    if (this.onInteract) {
      this.onInteract(instanceId, interaction);
    }

    return interaction;
  }

  /**
   * Determine the appropriate interaction based on context
   */
  determineInteraction(instance, def, gameState) {
    // Check for quest-related dialogs first
    const questDialog = this.getQuestDialog(instance, def, gameState);
    if (questDialog) {
      return {
        success: true,
        type: 'dialog',
        dialogId: questDialog,
        npc: instance
      };
    }

    // Check NPC type for default interactions
    switch (def.type) {
      case NPCType.MERCHANT:
        if (def.shop) {
          if (this.onShopOpen) {
            this.onShopOpen(instance.instanceId, def.shop);
          }
          return {
            success: true,
            type: 'shop',
            shopId: def.shop,
            npc: instance
          };
        }
        break;

      case NPCType.TRAINER:
        return {
          success: true,
          type: 'trainer',
          services: def.services || [],
          npc: instance
        };

      case NPCType.INNKEEPER:
        return {
          success: true,
          type: 'inn',
          services: ['rest', 'save'],
          cost: def.restCost || 10,
          npc: instance
        };
    }

    // Default to dialog
    if (instance.currentDialog) {
      if (this.onDialogStart) {
        this.onDialogStart(instance.instanceId, instance.currentDialog);
      }
      return {
        success: true,
        type: 'dialog',
        dialogId: instance.currentDialog,
        npc: instance
      };
    }

    // Fallback: generic greeting
    return {
      success: true,
      type: 'generic',
      message: def.genericGreeting || `${instance.name} nods at you.`,
      npc: instance
    };
  }

  /**
   * Get appropriate quest-related dialog
   */
  getQuestDialog(instance, def, gameState) {
    const quests = gameState.quests || {};
    
    // Check if NPC has quest turn-in
    for (const questId of instance.quests) {
      if (quests[questId] === 'ready_to_complete') {
        return def.questDialogs?.[questId]?.complete || null;
      }
    }

    // Check if NPC has quest in progress
    for (const questId of instance.quests) {
      if (quests[questId] === 'active') {
        return def.questDialogs?.[questId]?.inProgress || null;
      }
    }

    // Check if NPC has available quest
    for (const questId of instance.quests) {
      if (!quests[questId]) {
        return def.questDialogs?.[questId]?.offer || null;
      }
    }

    return null;
  }

  /**
   * Update NPC dialog based on game state changes
   */
  updateNPCDialog(instanceId, dialogId) {
    const instance = this.npcInstances.get(instanceId);
    if (instance) {
      instance.currentDialog = dialogId;
    }
  }

  /**
   * Set NPC state
   */
  setNPCState(instanceId, state) {
    const instance = this.npcInstances.get(instanceId);
    if (instance && Object.values(NPCState).includes(state)) {
      instance.state = state;
    }
  }

  /**
   * Move NPC to new position
   */
  moveNPC(instanceId, x, y) {
    const instance = this.npcInstances.get(instanceId);
    if (instance) {
      instance.position = { x, y };
    }
  }

  /**
   * Change NPC location (room transition)
   */
  relocateNPC(instanceId, newLocation) {
    const instance = this.npcInstances.get(instanceId);
    if (!instance) return false;

    // Remove from old location index
    const oldLocationNpcs = this.npcsByLocation.get(instance.location);
    if (oldLocationNpcs) {
      oldLocationNpcs.delete(instanceId);
    }

    // Add to new location index
    if (!this.npcsByLocation.has(newLocation)) {
      this.npcsByLocation.set(newLocation, new Set());
    }
    this.npcsByLocation.get(newLocation).add(instanceId);

    instance.location = newLocation;
    return true;
  }

  /**
   * Set NPC flag (for tracking state)
   */
  setNPCFlag(instanceId, flagName, value) {
    const instance = this.npcInstances.get(instanceId);
    if (instance) {
      instance.flags[flagName] = value;
    }
  }

  /**
   * Get NPC flag
   */
  getNPCFlag(instanceId, flagName) {
    const instance = this.npcInstances.get(instanceId);
    return instance?.flags[flagName];
  }

  /**
   * Get all NPC instances
   */
  getAllNPCs() {
    return Array.from(this.npcInstances.values());
  }

  /**
   * Get state for saving
   */
  getState() {
    const instances = {};
    for (const [id, instance] of this.npcInstances) {
      instances[id] = {
        ...instance,
        // Don't save callbacks
      };
    }
    return {
      instances,
      npcsByLocation: Object.fromEntries(
        Array.from(this.npcsByLocation.entries()).map(([loc, set]) => [loc, Array.from(set)])
      )
    };
  }

  /**
   * Restore state from save
   */
  restoreState(state) {
    if (!state) return;

    this.npcInstances = new Map(Object.entries(state.instances || {}));
    this.npcsByLocation = new Map(
      Object.entries(state.npcsByLocation || {}).map(([loc, arr]) => [loc, new Set(arr)])
    );
  }
}

// ── Factory Functions ────────────────────────────────────────────────

/**
 * Create a new NPCManager instance
 */
function createNPCManager() {
  return new NPCManager();
}

/**
 * Create an NPC definition
 */
function createNPCDefinition(id, name, type, options = {}) {
  return {
    id,
    name,
    type,
    description: options.description || '',
    sprite: options.sprite || 'default_npc',
    portrait: options.portrait || null,
    defaultDialog: options.defaultDialog || null,
    genericGreeting: options.genericGreeting || null,
    shop: options.shop || null,
    quests: options.quests || [],
    questDialogs: options.questDialogs || {},
    services: options.services || [],
    restCost: options.restCost || 10,
    schedule: options.schedule || null,  // For time-based behavior
    faction: options.faction || 'neutral'
  };
}

// ── Exports ──────────────────────────────────────────────────────────
export {
  NPCManager,
  NPCType,
  NPCState,
  createNPCManager,
  createNPCDefinition
};
