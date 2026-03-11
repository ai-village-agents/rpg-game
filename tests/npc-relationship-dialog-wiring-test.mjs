import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { initialState, initialStateWithClass } from '../src/state.js';
import { handleExplorationAction } from '../src/handlers/exploration-handler.js';
import {
  ROOM_NPCS,
  RELATIONSHIP_GREETINGS,
  getRelationshipGreeting,
  getRelationshipLabel,
  createDialogState,
} from '../src/npc-dialog.js';
import {
  RelationshipLevel,
  ReputationEvent,
  NPCRelationshipManager,
} from '../src/npc-relationships.js';

const ALL_NPCS = Object.values(ROOM_NPCS).flat();
const NPC_BY_ID = new Map(ALL_NPCS.map((npc) => [npc.id, npc]));

function createExplorationState() {
  return { ...initialStateWithClass('warrior'), phase: 'exploration' };
}

describe('getRelationshipGreeting (village_elder)', () => {
  it('returns HOSTILE greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('village_elder', RelationshipLevel.HOSTILE),
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.HOSTILE]
    );
  });

  it('returns UNFRIENDLY greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('village_elder', RelationshipLevel.UNFRIENDLY),
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.UNFRIENDLY]
    );
  });

  it('returns NEUTRAL greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('village_elder', RelationshipLevel.NEUTRAL),
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.NEUTRAL]
    );
  });

  it('returns FRIENDLY greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('village_elder', RelationshipLevel.FRIENDLY),
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.FRIENDLY]
    );
  });

  it('returns ALLIED greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('village_elder', RelationshipLevel.ALLIED),
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.ALLIED]
    );
  });
});

describe('getRelationshipGreeting fallback behavior', () => {
  it('falls back to default greeting when npcId missing from RELATIONSHIP_GREETINGS', () => {
    const npcId = 'village_elder';
    const original = RELATIONSHIP_GREETINGS[npcId];
    delete RELATIONSHIP_GREETINGS[npcId];
    try {
      const greeting = getRelationshipGreeting(npcId, RelationshipLevel.NEUTRAL);
      assert.strictEqual(greeting, NPC_BY_ID.get(npcId).greeting);
    } finally {
      RELATIONSHIP_GREETINGS[npcId] = original;
    }
  });
});

describe('getRelationshipLabel', () => {
  it('returns human-readable labels for all levels', () => {
    assert.strictEqual(getRelationshipLabel(RelationshipLevel.HOSTILE), 'Hostile');
    assert.strictEqual(getRelationshipLabel(RelationshipLevel.UNFRIENDLY), 'Unfriendly');
    assert.strictEqual(getRelationshipLabel(RelationshipLevel.NEUTRAL), 'Neutral');
    assert.strictEqual(getRelationshipLabel(RelationshipLevel.FRIENDLY), 'Friendly');
    assert.strictEqual(getRelationshipLabel(RelationshipLevel.ALLIED), 'Allied');
  });
});

describe('createDialogState relationship wiring', () => {
  it('preserves backward compatibility when no relationshipLevel is provided', () => {
    const npc = NPC_BY_ID.get('village_elder');
    const dialogState = createDialogState(npc);
    assert.strictEqual(dialogState.greeting, npc.greeting);
    assert.ok(!('relationshipLevel' in dialogState));
  });

  it('sets greeting and relationshipLevel when provided', () => {
    const npc = NPC_BY_ID.get('inn_keeper');
    const dialogState = createDialogState(npc, RelationshipLevel.FRIENDLY);
    assert.strictEqual(
      dialogState.greeting,
      RELATIONSHIP_GREETINGS.inn_keeper[RelationshipLevel.FRIENDLY]
    );
    assert.strictEqual(dialogState.relationshipLevel, RelationshipLevel.FRIENDLY);
  });

  it('sets hostile greeting for village_elder', () => {
    const npc = NPC_BY_ID.get('village_elder');
    const dialogState = createDialogState(npc, RelationshipLevel.HOSTILE);
    assert.strictEqual(
      dialogState.greeting,
      RELATIONSHIP_GREETINGS.village_elder[RelationshipLevel.HOSTILE]
    );
  });

  it('sets allied greeting when relationship is ALLIED', () => {
    const npc = NPC_BY_ID.get('inn_keeper');
    const dialogState = createDialogState(npc, RelationshipLevel.ALLIED);
    assert.strictEqual(
      dialogState.greeting,
      RELATIONSHIP_GREETINGS.inn_keeper[RelationshipLevel.ALLIED]
    );
  });
});

describe('RELATIONSHIP_GREETINGS structure', () => {
  it('contains entries for all NPC IDs', () => {
    for (const npc of ALL_NPCS) {
      assert.ok(RELATIONSHIP_GREETINGS[npc.id]);
    }
  });

  it('contains all relationship levels for each NPC', () => {
    const levels = Object.values(RelationshipLevel);
    for (const npc of ALL_NPCS) {
      for (const level of levels) {
        assert.ok(RELATIONSHIP_GREETINGS[npc.id][level]);
      }
    }
  });

  it('neutral greetings match the original NPC greeting', () => {
    for (const npc of ALL_NPCS) {
      assert.strictEqual(
        RELATIONSHIP_GREETINGS[npc.id][RelationshipLevel.NEUTRAL],
        npc.greeting
      );
    }
  });
});

describe('getRelationshipGreeting (other NPCs)', () => {
  it('returns all five greetings for inn_keeper', () => {
    const levels = Object.values(RelationshipLevel);
    for (const level of levels) {
      assert.strictEqual(
        getRelationshipGreeting('inn_keeper', level),
        RELATIONSHIP_GREETINGS.inn_keeper[level]
      );
    }
  });

  it('returns swamp_witch ALLIED greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('swamp_witch', RelationshipLevel.ALLIED),
      RELATIONSHIP_GREETINGS.swamp_witch[RelationshipLevel.ALLIED]
    );
  });

  it('returns forest_spirit HOSTILE greeting', () => {
    assert.strictEqual(
      getRelationshipGreeting('forest_spirit', RelationshipLevel.HOSTILE),
      RELATIONSHIP_GREETINGS.forest_spirit[RelationshipLevel.HOSTILE]
    );
  });
});

describe('NPC relationship state wiring', () => {
  it('initialState includes npcRelationshipManager', () => {
    const state = initialState();
    assert.ok(state.npcRelationshipManager);
  });

  it('initialStateWithClass includes npcRelationshipManager', () => {
    const state = initialStateWithClass('warrior');
    assert.ok(state.npcRelationshipManager);
  });

  it('npcRelationshipManager is an NPCRelationshipManager instance', () => {
    const state = initialStateWithClass('warrior');
    assert.ok(state.npcRelationshipManager instanceof NPCRelationshipManager);
  });

  it('starts at NEUTRAL reputation after 0 talks', () => {
    const state = initialStateWithClass('warrior');
    const level = state.npcRelationshipManager.getRelationshipLevel('village_elder');
    assert.strictEqual(level, RelationshipLevel.NEUTRAL);
  });
});

describe('TALK_TO_NPC relationship integration', () => {
  it('updates npcRelationshipManager reputation', () => {
    let state = createExplorationState();
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    const relationship = state.npcRelationshipManager.getRelationship('village_elder');
    assert.strictEqual(relationship.reputation, ReputationEvent.DIALOGUE_POSITIVE.value);
  });

  it('sets dialogState.relationshipLevel correctly', () => {
    let state = createExplorationState();
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    assert.strictEqual(state.dialogState.relationshipLevel, RelationshipLevel.NEUTRAL);
  });

  it('shows friendly greeting for friendly NPC', () => {
    let state = createExplorationState();
    state.npcRelationshipManager.modifyReputation('inn_keeper', 10, 'test');
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'inn_keeper' });
    assert.strictEqual(
      state.dialogState.greeting,
      RELATIONSHIP_GREETINGS.inn_keeper[RelationshipLevel.FRIENDLY]
    );
  });

  it('increases reputation progressively with multiple talks', () => {
    let state = createExplorationState();
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    state = { ...state, phase: 'exploration' };
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    state = { ...state, phase: 'exploration' };
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    const relationship = state.npcRelationshipManager.getRelationship('village_elder');
    assert.strictEqual(relationship.reputation, ReputationEvent.DIALOGUE_POSITIVE.value * 3);
  });

  it('upgrades relationship from NEUTRAL to FRIENDLY after enough talks', () => {
    let state = createExplorationState();
    for (let i = 0; i < 4; i++) {
      state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
      state = { ...state, phase: 'exploration' };
    }
    const level = state.npcRelationshipManager.getRelationshipLevel('village_elder');
    assert.strictEqual(level, RelationshipLevel.FRIENDLY);
  });

  it('persists relationship state across multiple TALK_TO_NPC actions', () => {
    let state = createExplorationState();
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    const manager = state.npcRelationshipManager;
    state = { ...state, phase: 'exploration' };
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    assert.strictEqual(state.npcRelationshipManager, manager);
    assert.strictEqual(
      manager.getRelationship('village_elder').reputation,
      ReputationEvent.DIALOGUE_POSITIVE.value * 2
    );
  });

  it('handles nonexistent npcId gracefully', () => {
    const state = createExplorationState();
    const next = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'not_here' });
    assert.ok(next.log[next.log.length - 1].includes('not here'));
    assert.strictEqual(next.phase, 'exploration');
    assert.ok(!next.dialogState);
  });

  it('uses DIALOGUE_POSITIVE value (+3) for reputation changes', () => {
    let state = createExplorationState();
    state = handleExplorationAction(state, { type: 'TALK_TO_NPC', npcId: 'village_elder' });
    const history = state.npcRelationshipManager.getRelationshipHistory('village_elder');
    assert.strictEqual(history[0].change, ReputationEvent.DIALOGUE_POSITIVE.value);
  });
});
