/**
 * Quest Integration Module
 * Bridges exploration gameplay with the quest system.
 * Tracks active quests, checks objectives, awards rewards.
 */

import { getExplorationQuest, getExplorationQuests, getQuestsForRoom } from './data/exploration-quests.js';
import { getCompanionById, isCompanionRecruited } from './companions.js';
import { getLoyaltyTier, getLoyaltyTierIndex, LOYALTY_TIER_ORDER } from './companion-loyalty-events.js';
import { removeItemFromInventory } from './items.js';

/**
 * Initialize quest tracking state
 * @returns {Object} Initial quest state
 */
function initQuestState() {
  return {
    activeQuests: [],      // Array of quest IDs player has accepted
    completedQuests: [],   // Array of completed quest IDs
    questProgress: {},     // { questId: { stageIndex: number, objectiveProgress: { objId: value } } }
    discoveredRooms: []    // Rooms player has visited (for EXPLORE objectives)
  };
}

/**
 * Check if companion requirements for a quest are met.
 * Quest definitions may include a companionRequirements array:
 *   [{ companionId, inParty?, minLoyaltyTier?, requireSoulbound? }]
 * Each entry specifies constraints for ONE companion.
 * @param {Object} gameState - Full game state (must have companions array)
 * @param {Array} requirements - Array of companion requirement objects
 * @returns {{ met: boolean, unmet: Array<{companionId: string, reason: string}> }}
 */
function checkCompanionRequirements(gameState, requirements) {
  if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
    return { met: true, unmet: [] };
  }

  const unmet = [];

  for (const req of requirements) {
    if (!req.companionId) continue;

    // Check if companion is in party
    const companion = getCompanionById(gameState, req.companionId);

    if (req.inParty) {
      if (!companion) {
        unmet.push({ companionId: req.companionId, reason: 'not_in_party' });
        continue; // Can't check loyalty/soulbound if not in party
      }
    }

    if (req.minLoyaltyTier && companion) {
      const requiredIndex = LOYALTY_TIER_ORDER.indexOf(req.minLoyaltyTier);
      const currentIndex = getLoyaltyTierIndex(companion.loyalty ?? 0);
      if (requiredIndex === -1 || currentIndex < requiredIndex) {
        unmet.push({ companionId: req.companionId, reason: 'loyalty_too_low' });
      }
    }

    if (req.requireSoulbound) {
      if (!companion || !companion.soulbound) {
        unmet.push({ companionId: req.companionId, reason: 'not_soulbound' });
      }
    }
  }

  return { met: unmet.length === 0, unmet };
}

/**
 * Accept a quest, adding it to active quests
 * @param {Object} questState - Current quest state
 * @param {string} questId - Quest to accept
 * @returns {Object} { questState, accepted, message }
 */
function acceptQuest(questState, questId, gameState) {
  const quest = getExplorationQuest(questId);
  if (!quest) {
    return { questState, accepted: false, message: `Quest "${questId}" not found.` };
  }

  if (questState.activeQuests.includes(questId)) {
    return { questState, accepted: false, message: `Quest "${quest.name}" is already active.` };
  }

  if (questState.completedQuests.includes(questId)) {
    return { questState, accepted: false, message: `Quest "${quest.name}" is already completed.` };
  }

  // Check prerequisites
  for (const prereq of quest.prerequisites || []) {
    if (!questState.completedQuests.includes(prereq)) {
      return { questState, accepted: false, message: `Must complete prerequisite quest first.` };
    }
  }

  // Check companion requirements (if gameState provided)
  if (gameState && quest.companionRequirements) {
    const { met, unmet } = checkCompanionRequirements(gameState, quest.companionRequirements);
    if (!met) {
      const reasons = unmet.map(u => {
        if (u.reason === 'not_in_party') return u.companionId + ' must be in your party';
        if (u.reason === 'loyalty_too_low') return u.companionId + ' loyalty is too low';
        if (u.reason === 'not_soulbound') return u.companionId + ' must be soulbound';
        return u.companionId + ': requirement not met';
      });
      return { questState, accepted: false, message: 'Companion requirements not met: ' + reasons.join('; ') + '.' };
    }
  }

  const newState = {
    ...questState,
    activeQuests: [...questState.activeQuests, questId],
    questProgress: {
      ...questState.questProgress,
      [questId]: {
        stageIndex: 0,
        objectiveProgress: {}
      }
    }
  };

  return {
    questState: newState,
    accepted: true,
    message: `Quest accepted: ${quest.name}`
  };
}

/**
 * Check and update EXPLORE objectives when player enters a room
 * @param {Object} questState - Current quest state
 * @param {string} roomId - Room the player entered
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onRoomEnter(questState, roomId) {
  if (!roomId) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];

  // Track room discovery
  let newState = questState;
  if (!questState.discoveredRooms.includes(roomId)) {
    newState = {
      ...newState,
      discoveredRooms: [...newState.discoveredRooms, roomId]
    };
  }

  // Check all active quests for EXPLORE objectives
  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'EXPLORE' && objective.locationId === roomId) {
        // Check if objective was already complete
        const wasComplete = progress.objectiveProgress[objective.id] === true;
        if (!wasComplete) {
          // Mark objective complete
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: true
                }
              }
            }
          };
          objectiveUpdated = true;
          completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
          messages.push(`✓ ${objective.description}`);
        }
      }

      // Check if this objective is complete (required)
      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required && !objProgress) {
        stageComplete = false;
      }
    }

    // Check if stage is now complete
    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        // Find next stage index
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        // Quest complete!
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Update KILL objective progress
 * @param {Object} questState - Current quest state
 * @param {string} enemyType - Type of enemy killed
 * @param {number} count - Number killed (default 1)
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onEnemyKill(questState, enemyType, count = 1) {
  if (!enemyType) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'KILL' && objective.enemyType === enemyType) {
        const currentCount = progress.objectiveProgress[objective.id] || 0;
        const newCount = Math.min(currentCount + count, objective.count);

        if (newCount > currentCount) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: newCount
                }
              }
            }
          };
          objectiveUpdated = true;

          if (newCount >= objective.count) {
            completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
            messages.push(`✓ ${objective.description} (${newCount}/${objective.count})`);
          } else {
            messages.push(`${objective.description}: ${newCount}/${objective.count}`);
          }
        }
      }

      // Check if this objective is complete
      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required) {
        if (objective.type === 'KILL') {
          if ((objProgress || 0) < objective.count) stageComplete = false;
        } else if (!objProgress) {
          stageComplete = false;
        }
      }
    }

    // Handle stage/quest completion (same as onRoomEnter)
    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Update TALK objective progress when speaking to an NPC
 * @param {Object} questState - Current quest state
 * @param {string} npcId - NPC being spoken to
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onNPCTalk(questState, npcId) {
  if (!npcId) {
    return { questState, messages: [], completedObjectives: [], completedStages: [], completedQuests: [] };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (objective.type === 'TALK' && objective.npcId === npcId) {
        const alreadyComplete = progress.objectiveProgress[objective.id] === true;
        if (!alreadyComplete) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: true
                }
              }
            }
          };
          objectiveUpdated = true;
          completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
          messages.push(`✓ ${objective.description}`);
        }
      }

      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required) {
        if (objective.type === 'KILL') {
          if ((objProgress || 0) < objective.count) stageComplete = false;
        } else if (!objProgress) {
          stageComplete = false;
        }
      }
    }

    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Update DELIVER objective progress when delivering items to an NPC
 * @param {Object} questState - Current quest state
 * @param {string} npcId - NPC being spoken to
 * @param {Object} playerInventory - Player inventory { [itemId]: count }
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests, itemsConsumed }
 */
function onNPCDeliver(questState, npcId, playerInventory) {
  if (!npcId) {
    return {
      questState,
      messages: [],
      completedObjectives: [],
      completedStages: [],
      completedQuests: [],
      itemsConsumed: []
    };
  }

  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  const itemsConsumed = [];
  const inventory = playerInventory || {};
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      if (
        objective.type === 'DELIVER'
        && (objective.targetNpcId === npcId || objective.npcId === npcId)
      ) {
        const alreadyComplete = progress.objectiveProgress[objective.id] === true;
        if (!alreadyComplete) {
          const requiredItems = [];
          if (Array.isArray(objective.itemIds)) {
            for (const entry of objective.itemIds) {
              if (!entry) continue;
              if (typeof entry === 'string') {
                requiredItems.push({ itemId: entry, count: 1 });
              } else if (typeof entry === 'object' && entry.itemId) {
                requiredItems.push({ itemId: entry.itemId, count: entry.count || 1 });
              }
            }
          } else if (objective.itemId) {
            requiredItems.push({ itemId: objective.itemId, count: objective.count || 1 });
          }

          let hasAllItems = requiredItems.length > 0;
          for (const req of requiredItems) {
            const available = inventory[req.itemId] || 0;
            if (available < req.count) {
              hasAllItems = false;
              break;
            }
          }

          if (hasAllItems) {
            newState = {
              ...newState,
              questProgress: {
                ...newState.questProgress,
                [questId]: {
                  ...newState.questProgress[questId],
                  objectiveProgress: {
                    ...newState.questProgress[questId].objectiveProgress,
                    [objective.id]: true
                  }
                }
              }
            };
            objectiveUpdated = true;
            completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
            messages.push(`✓ ${objective.description}`);
            for (const req of requiredItems) {
              itemsConsumed.push({ itemId: req.itemId, quantity: req.count });
            }
          }
        }
      }

      const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
      if (objective.required) {
        if (objective.type === 'KILL') {
          if ((objProgress || 0) < objective.count) stageComplete = false;
        } else if (!objProgress) {
          stageComplete = false;
        }
      }
    }

    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items?.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests, itemsConsumed };
}

/**
 * Get current progress for a quest
 * @param {Object} questState - Current quest state
 * @param {string} questId - Quest ID
 * @returns {Object|null} Progress info or null if not active
 */
function getQuestProgress(questState, questId) {
  const quest = getExplorationQuest(questId);
  if (!quest) return null;

  const isActive = questState.activeQuests.includes(questId);
  const isComplete = questState.completedQuests.includes(questId);
  const progress = questState.questProgress[questId];

  if (!isActive && !isComplete) return null;

  const currentStage = isComplete ? null : quest.stages[progress?.stageIndex || 0];

  return {
    questId,
    questName: quest.name,
    isActive,
    isComplete,
    currentStage: currentStage?.name || null,
    stageIndex: progress?.stageIndex || 0,
    totalStages: quest.stages.length,
    objectiveProgress: progress?.objectiveProgress || {}
  };
}

/**
 * Get available quests that can be started in a room
 * @param {Object} questState - Current quest state
 * @param {string} roomId - Room ID
 * @returns {Array} Array of quest objects available to accept
 */
function getAvailableQuestsInRoom(questState, roomId, gameState) {
  const roomQuests = getQuestsForRoom(roomId);
  return roomQuests.filter(quest => {
    // Not already active or completed
    if (questState.activeQuests.includes(quest.id)) return false;
    if (questState.completedQuests.includes(quest.id)) return false;
    // Prerequisites met
    for (const prereq of quest.prerequisites || []) {
      if (!questState.completedQuests.includes(prereq)) return false;
    }
    // Check companion requirements (if gameState provided)
    if (gameState && quest.companionRequirements) {
      const { met } = checkCompanionRequirements(gameState, quest.companionRequirements);
      if (!met) return false;
    }
    return true;
  });
}

/**
 * Get summary of all active quests
 * @param {Object} questState - Current quest state
 * @returns {Array} Array of quest progress summaries
 */

/**
 * Get summary of all completed quests
 * @param {Object} questState - Current quest state
 * @returns {Array} Array of completed quest summaries
 */
function getCompletedQuestsSummary(questState) {
  if (!questState || !questState.completedQuests) return [];
  
  return questState.completedQuests.map(questId => {
    const quest = getExplorationQuest(questId);
    if (!quest) return null;
    return {
      questId: questId,
      questName: quest.name,
      description: quest.description || "",
      level: quest.level || 1,
      difficulty: quest.difficulty || "normal",
      rewards: quest.rewards || null
    };
  }).filter(Boolean);
}

function getActiveQuestsSummary(questState) {
  return questState.activeQuests.map(questId => getQuestProgress(questState, questId)).filter(Boolean);
}

/**
 * Check if companion-related stage objectives are satisfied.
 * Supports objective types: COMPANION_IN_PARTY, COMPANION_LOYALTY, COMPANION_SOULBOUND
 * @param {Object} gameState - Full game state
 * @param {Object} objective - Objective definition
 * @returns {boolean} Whether the objective is currently satisfied
 */
function checkCompanionObjective(gameState, objective) {
  if (!gameState || !objective) return false;

  const companion = getCompanionById(gameState, objective.companionId);

  switch (objective.type) {
    case 'COMPANION_IN_PARTY':
      return !!companion;
    case 'COMPANION_LOYALTY': {
      if (!companion) return false;
      const requiredIndex = LOYALTY_TIER_ORDER.indexOf(objective.minLoyaltyTier);
      const currentIndex = getLoyaltyTierIndex(companion.loyalty ?? 0);
      return requiredIndex !== -1 && currentIndex >= requiredIndex;
    }
    case 'COMPANION_SOULBOUND':
      return !!companion && !!companion.soulbound;
    default:
      return false;
  }
}

/**
 * Check all companion-type objectives in the current stage of active quests.
 * Call this whenever party composition or loyalty changes.
 * @param {Object} questState - Current quest state
 * @param {Object} gameState - Full game state (with companions)
 * @returns {Object} { questState, messages, completedObjectives, completedStages, completedQuests }
 */
function onCompanionStateChange(questState, gameState) {
  const messages = [];
  const completedObjectives = [];
  const completedStages = [];
  const completedQuests = [];
  let newState = questState;

  for (const questId of newState.activeQuests) {
    const quest = getExplorationQuest(questId);
    if (!quest) continue;

    const progress = newState.questProgress[questId];
    if (!progress) continue;

    const stage = quest.stages[progress.stageIndex];
    if (!stage || !stage.objectives) continue;

    let stageComplete = true;
    let objectiveUpdated = false;

    for (const objective of stage.objectives) {
      const isCompanionType = ['COMPANION_IN_PARTY', 'COMPANION_LOYALTY', 'COMPANION_SOULBOUND'].includes(objective.type);

      if (isCompanionType) {
        const satisfied = checkCompanionObjective(gameState, objective);
        const wasSatisfied = progress.objectiveProgress[objective.id] === true;

        if (satisfied && !wasSatisfied) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                objectiveProgress: {
                  ...newState.questProgress[questId].objectiveProgress,
                  [objective.id]: true
                }
              }
            }
          };
          objectiveUpdated = true;
          completedObjectives.push({ questId, objectiveId: objective.id, description: objective.description });
          messages.push(`✓ ${objective.description}`);
        }

        // For required companion objectives, re-evaluate satisfaction live
        if (objective.required && !satisfied) {
          stageComplete = false;
        }
      } else {
        // Non-companion objectives: check existing progress
        const objProgress = newState.questProgress[questId].objectiveProgress[objective.id];
        if (objective.required) {
          if (objective.type === 'KILL') {
            if ((objProgress || 0) < objective.count) stageComplete = false;
          } else if (!objProgress) {
            stageComplete = false;
          }
        }
      }
    }

    // Handle stage/quest completion
    if (stageComplete && objectiveUpdated) {
      const nextStageId = stage.nextStage;
      if (nextStageId) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
        if (nextStageIndex !== -1) {
          newState = {
            ...newState,
            questProgress: {
              ...newState.questProgress,
              [questId]: {
                ...newState.questProgress[questId],
                stageIndex: nextStageIndex,
                objectiveProgress: {}
              }
            }
          };
          completedStages.push({ questId, stageId: stage.id, stageName: stage.name });
          messages.push(`Stage complete: ${stage.name}`);
          messages.push(`New objective: ${quest.stages[nextStageIndex].name}`);
        }
      } else {
        newState = {
          ...newState,
          activeQuests: newState.activeQuests.filter(id => id !== questId),
          completedQuests: [...newState.completedQuests, questId],
          questProgress: {
            ...newState.questProgress,
            [questId]: { ...newState.questProgress[questId], completed: true }
          }
        };
        completedQuests.push({ questId, questName: quest.name, rewards: quest.rewards });
        messages.push(`★ Quest complete: ${quest.name}!`);
        if (quest.rewards) {
          if (quest.rewards.experience) messages.push(`  +${quest.rewards.experience} XP`);
          if (quest.rewards.gold) messages.push(`  +${quest.rewards.gold} Gold`);
          if (quest.rewards.items && quest.rewards.items.length) messages.push(`  Items: ${quest.rewards.items.join(', ')}`);
        }
      }
    }
  }

  return { questState: newState, messages, completedObjectives, completedStages, completedQuests };
}

/**
 * Get a human-readable description of companion requirements for a quest
 * @param {Object} quest - Quest definition object
 * @returns {Array<string>} Array of requirement description strings
 */
function describeCompanionRequirements(quest) {
  if (!quest || !quest.companionRequirements || !Array.isArray(quest.companionRequirements)) {
    return [];
  }
  return quest.companionRequirements.map(req => {
    const parts = [];
    if (req.inParty) parts.push(req.companionId + ' must be in party');
    if (req.minLoyaltyTier) parts.push(req.companionId + ' loyalty: ' + req.minLoyaltyTier + '+');
    if (req.requireSoulbound) parts.push(req.companionId + ' must be soulbound');
    return parts.join(', ');
  }).filter(s => s.length > 0);
}

/**
 * Apply quest rewards to player state
 * @param {Object} playerState - Player state object
 * @param {Object} rewards - Rewards object { experience, gold, items }
 * @returns {Object} { playerState, messages }
 */
function applyQuestRewards(playerState, rewards) {
  if (!rewards) return { playerState, messages: [] };

  const messages = [];
  let newPlayer = { ...playerState };

  if (rewards.experience && rewards.experience > 0) {
    const oldXp = newPlayer.xp || 0;
    newPlayer = { ...newPlayer, xp: oldXp + rewards.experience };
    messages.push(`Gained ${rewards.experience} experience.`);
  }

  if (rewards.gold && rewards.gold > 0) {
    const oldGold = newPlayer.gold || 0;
    newPlayer = { ...newPlayer, gold: oldGold + rewards.gold };
    messages.push(`Gained ${rewards.gold} gold.`);
  }

  if (rewards.items && rewards.items.length > 0) {
    const inv = { ...(newPlayer.inventory || {}) };
    for (const item of rewards.items) {
      inv[item] = (inv[item] || 0) + 1;
      messages.push(`Received ${item}.`);
    }
    newPlayer = { ...newPlayer, inventory: inv };
  }

  return { playerState: newPlayer, messages };
}

export {
  initQuestState,
  acceptQuest,
  onRoomEnter,
  onEnemyKill,
  onNPCTalk,
  onNPCDeliver,
  getQuestProgress,
  getAvailableQuestsInRoom,
  getActiveQuestsSummary,
  getCompletedQuestsSummary,
  applyQuestRewards,
  checkCompanionRequirements,
  checkCompanionObjective,
  onCompanionStateChange,
  describeCompanionRequirements
};
