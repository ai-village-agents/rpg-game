/**
 * Tests for Exploration Quests
 * Verifies map-aligned quest structure and helpers
 */

import {
  EXPLORATION_QUESTS,
  getExplorationQuests,
  getExplorationQuest,
  getQuestsForRoom,
  getQuestLocations
} from '../src/data/exploration-quests.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition, msg = 'Assertion failed') {
  if (!condition) throw new Error(msg);
}

// Valid map room IDs from src/map.js
const VALID_ROOM_IDS = ['nw', 'n', 'ne', 'w', 'center', 'e', 'sw', 's', 'se'];

console.log('\n=== Exploration Quest Structure Tests ===\n');

test('EXPLORATION_QUESTS is defined and has quests', () => {
  assert(EXPLORATION_QUESTS !== undefined, 'EXPLORATION_QUESTS undefined');
  assert(Object.keys(EXPLORATION_QUESTS).length >= 5, 'Should have at least 5 quests');
});

test('All quests have required fields', () => {
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    assert(quest.id === id, `Quest id mismatch: ${id}`);
    assert(quest.name, `Quest ${id} missing name`);
    assert(quest.description, `Quest ${id} missing description`);
    assert(quest.type, `Quest ${id} missing type`);
    assert(quest.level >= 1, `Quest ${id} invalid level`);
    assert(Array.isArray(quest.stages), `Quest ${id} stages not array`);
    assert(quest.stages.length >= 1, `Quest ${id} needs at least 1 stage`);
    assert(quest.rewards, `Quest ${id} missing rewards`);
  }
});

test('All quest stages have valid structure', () => {
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    for (const stage of quest.stages) {
      assert(stage.id, `Stage in ${id} missing id`);
      assert(stage.name, `Stage ${stage.id} missing name`);
      assert(stage.description, `Stage ${stage.id} missing description`);
      assert(Array.isArray(stage.objectives), `Stage ${stage.id} objectives not array`);
    }
  }
});

test('EXPLORE objectives use valid map room IDs', () => {
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    for (const stage of quest.stages) {
      for (const obj of stage.objectives || []) {
        if (obj.type === 'EXPLORE') {
          assert(
            VALID_ROOM_IDS.includes(obj.locationId),
            `Quest ${id} has invalid locationId: ${obj.locationId}`
          );
        }
      }
    }
  }
});

test('Quest types are valid', () => {
  const validTypes = ['MAIN', 'SIDE', 'DAILY', 'ACHIEVEMENT'];
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    assert(validTypes.includes(quest.type), `Quest ${id} has invalid type: ${quest.type}`);
  }
});

test('Rewards have proper structure', () => {
  for (const [id, quest] of Object.entries(EXPLORATION_QUESTS)) {
    const r = quest.rewards;
    assert(typeof r.experience === 'number', `Quest ${id} experience not number`);
    assert(typeof r.gold === 'number', `Quest ${id} gold not number`);
    assert(Array.isArray(r.items), `Quest ${id} items not array`);
  }
});

console.log('\n=== Helper Function Tests ===\n');

test('getExplorationQuests returns all quests', () => {
  const quests = getExplorationQuests();
  assert(Object.keys(quests).length === Object.keys(EXPLORATION_QUESTS).length);
});

test('getExplorationQuest returns correct quest', () => {
  const quest = getExplorationQuest('explore_village');
  assert(quest !== null, 'Quest should exist');
  assert(quest.name === 'Know Your Surroundings');
});

test('getExplorationQuest returns null for invalid id', () => {
  const quest = getExplorationQuest('nonexistent_quest');
  assert(quest === null, 'Should return null for invalid id');
});

test('getQuestsForRoom finds quests starting in center', () => {
  const quests = getQuestsForRoom('center');
  assert(quests.length >= 1, 'Should find at least 1 quest starting in center');
  const ids = quests.map(q => q.id);
  assert(ids.includes('explore_village'), 'explore_village starts in center');
});

test('getQuestLocations returns valid room IDs', () => {
  const locations = getQuestLocations();
  assert(locations.length >= 5, 'Should have multiple locations');
  for (const loc of locations) {
    assert(VALID_ROOM_IDS.includes(loc), `Invalid location: ${loc}`);
  }
});

test('world_tour quest covers all 9 rooms', () => {
  const tour = getExplorationQuest('world_tour');
  const exploreObjs = tour.stages[0].objectives.filter(o => o.type === 'EXPLORE');
  assert(exploreObjs.length === 9, 'World tour should visit all 9 rooms');
  const visited = new Set(exploreObjs.map(o => o.locationId));
  for (const roomId of VALID_ROOM_IDS) {
    assert(visited.has(roomId), `World tour missing room: ${roomId}`);
  }
});

console.log('\n=== Specific Quest Tests ===\n');

test('explore_village is level 1 beginner quest', () => {
  const quest = getExplorationQuest('explore_village');
  assert(quest.level === 1);
  assert(quest.type === 'SIDE');
  assert(quest.prerequisites.length === 0, 'Should have no prerequisites');
});

test('marsh_mystery requires explore_village', () => {
  const quest = getExplorationQuest('marsh_mystery');
  assert(quest.prerequisites.includes('explore_village'));
});

test('dock_investigation has 3 stages', () => {
  const quest = getExplorationQuest('dock_investigation');
  assert(quest.stages.length === 3);
  assert(quest.stages[0].id === 'reach_dock');
  assert(quest.stages[1].id === 'gather_evidence');
  assert(quest.stages[2].id === 'confront_smugglers');
});

test('ridge_expedition is MAIN quest type', () => {
  const quest = getExplorationQuest('ridge_expedition');
  assert(quest.type === 'MAIN');
});

test('grove_guardian has DELIVER objective', () => {
  const quest = getExplorationQuest('grove_guardian');
  const stage2 = quest.stages[1];
  const deliverObj = stage2.objectives.find(o => o.type === 'DELIVER');
  assert(deliverObj !== undefined, 'Should have DELIVER objective');
  assert(deliverObj.itemId === 'forest_herb');
});

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

process.exit(failed > 0 ? 1 : 0);
