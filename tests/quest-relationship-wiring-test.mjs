import test from 'node:test';
import assert from 'node:assert/strict';
import { handleExplorationAction } from '../src/handlers/exploration-handler.js';
import { createNPCRelationshipManager } from '../src/npc-relationships.js';
import { createWorldState } from '../src/map.js';

test('grove_guardian completion wires into NPC relationships', () => {
  const world = { ...createWorldState(), roomRow: 0, roomCol: 0 };
  const questState = {
    activeQuests: ['grove_guardian'],
    completedQuests: [],
    questProgress: {
      grove_guardian: {
        stageIndex: 1, // meet_guardian stage with TALK and DELIVER objectives
        objectiveProgress: {},
      },
    },
    discoveredRooms: [],
  };

  const initialState = {
    phase: 'exploration',
    world,
    questState,
    player: { inventory: { forest_herb: 1 } },
    npcRelationshipManager: createNPCRelationshipManager(),
    log: [],
  };

  const result = handleExplorationAction(initialState, { type: 'TALK_TO_NPC', npcId: 'forest_spirit' });

  assert.ok(result, 'handler returns updated state');
  assert.ok(
    result.questState.completedQuests.includes('grove_guardian'),
    'quest marked completed in quest state'
  );

  const relationship = result.npcRelationshipManager.getRelationship('forest_spirit');
  assert.ok(
    relationship.questsCompleted.includes('grove_guardian'),
    'quest recorded on forest_spirit relationship'
  );
});
