/**
 * Quest Integration Tests
 * Tests the quest system integration with exploration gameplay.
 */

import {
  initQuestState,
  acceptQuest,
  onRoomEnter,
  onEnemyKill,
  onNPCTalk,
  onNPCDeliver,
  getQuestProgress,
  getAvailableQuestsInRoom,
  getActiveQuestsSummary,
  applyQuestRewards
} from '../src/quest-integration.js';

import { EXPLORATION_QUESTS } from '../src/data/exploration-quests.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    failed++;
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.log(`  ❌ ${message}`);
    console.log(`    Expected: ${expectedStr}`);
    console.log(`    Actual: ${actualStr}`);
    failed++;
  }
}

// --- initQuestState ---
console.log('\n--- initQuestState ---');
{
  const state = initQuestState();
  assert(Array.isArray(state.activeQuests), 'activeQuests is array');
  assert(state.activeQuests.length === 0, 'activeQuests starts empty');
  assert(Array.isArray(state.completedQuests), 'completedQuests is array');
  assert(state.completedQuests.length === 0, 'completedQuests starts empty');
  assert(typeof state.questProgress === 'object', 'questProgress is object');
  assert(Array.isArray(state.discoveredRooms), 'discoveredRooms is array');
  assert(state.discoveredRooms.length === 0, 'discoveredRooms starts empty');
}

// --- acceptQuest ---
console.log('\n--- acceptQuest ---');
{
  let state = initQuestState();
  
  // Accept valid quest
  const result1 = acceptQuest(state, 'explore_village');
  assert(result1.accepted === true, 'can accept valid quest');
  assert(result1.questState.activeQuests.includes('explore_village'), 'quest added to activeQuests');
  assert(result1.questState.questProgress['explore_village'] !== undefined, 'progress entry created');
  assert(result1.message.includes('Quest accepted'), 'acceptance message returned');
  
  state = result1.questState;
  
  // Cannot accept same quest twice
  const result2 = acceptQuest(state, 'explore_village');
  assert(result2.accepted === false, 'cannot accept quest already active');
  assert(result2.message.includes('already active'), 'already active message');
  
  // Cannot accept invalid quest
  const result3 = acceptQuest(state, 'fake_quest_xyz');
  assert(result3.accepted === false, 'cannot accept non-existent quest');
  assert(result3.message.includes('not found'), 'not found message');
  
  // Cannot accept quest without prerequisite
  const result4 = acceptQuest(state, 'marsh_mystery');
  assert(result4.accepted === false, 'cannot accept quest without prerequisite');
  assert(result4.message.includes('prerequisite'), 'prerequisite message');
}

// --- onRoomEnter - EXPLORE objectives ---
console.log('\n--- onRoomEnter - EXPLORE objectives ---');
{
  let state = initQuestState();
  const { questState: stateWithQuest } = acceptQuest(state, 'explore_village');
  state = stateWithQuest;
  
  // Enter the center room (first objective of explore_village)
  const result1 = onRoomEnter(state, 'center');
  assert(result1.messages.length > 0, 'messages returned on objective complete');
  assert(result1.completedObjectives.length === 1, 'one objective completed');
  assert(result1.completedObjectives[0].objectiveId === 'visit_center', 'visit_center objective completed');
  assert(result1.questState.discoveredRooms.includes('center'), 'center added to discovered rooms');
  
  // Check stage advanced (should be on explore_paths now)
  const progress = result1.questState.questProgress['explore_village'];
  assert(progress.stageIndex === 1, 'stage advanced to explore_paths');
  
  state = result1.questState;
  
  // Enter north room
  const result2 = onRoomEnter(state, 'n');
  assert(result2.completedObjectives.length === 1, 'north objective completed');
  assert(result2.questState.discoveredRooms.includes('n'), 'n added to discovered rooms');
  
  state = result2.questState;
  
  // Enter south room (final objective)
  const result3 = onRoomEnter(state, 's');
  assert(result3.completedQuests.length === 1, 'quest completed');
  assert(result3.completedQuests[0].questId === 'explore_village', 'explore_village completed');
  assert(result3.questState.completedQuests.includes('explore_village'), 'quest in completedQuests');
  assert(!result3.questState.activeQuests.includes('explore_village'), 'quest removed from activeQuests');
}

// --- onRoomEnter - room discovery tracking ---
console.log('\n--- onRoomEnter - room discovery ---');
{
  let state = initQuestState();
  
  const result1 = onRoomEnter(state, 'nw');
  assert(result1.questState.discoveredRooms.includes('nw'), 'nw discovered');
  
  state = result1.questState;
  const result2 = onRoomEnter(state, 'nw');
  assert(result2.questState.discoveredRooms.filter(r => r === 'nw').length === 1, 'nw not duplicated');
  
  const result3 = onRoomEnter(state, 'se');
  assert(result3.questState.discoveredRooms.includes('se'), 'se discovered');
  assert(result3.questState.discoveredRooms.includes('nw'), 'nw still there');
}

// --- onRoomEnter - no quest active ---
console.log('\n--- onRoomEnter - no active quest ---');
{
  const state = initQuestState();
  const result = onRoomEnter(state, 'center');
  assert(result.messages.length === 0, 'no messages when no quest active');
  assert(result.completedObjectives.length === 0, 'no objectives completed');
  assert(result.questState.discoveredRooms.includes('center'), 'room still tracked for discovery');
}

// --- onRoomEnter - null/undefined roomId ---
console.log('\n--- onRoomEnter - edge cases ---');
{
  const state = initQuestState();
  
  const result1 = onRoomEnter(state, null);
  assert(result1.messages.length === 0, 'null roomId returns empty messages');
  
  const result2 = onRoomEnter(state, undefined);
  assert(result2.messages.length === 0, 'undefined roomId returns empty messages');
}

// --- onEnemyKill - KILL objectives ---
console.log('\n--- onEnemyKill - KILL objectives ---');
{
  // First complete explore_village to unlock marsh_mystery
  let state = initQuestState();
  const { questState: s1 } = acceptQuest(state, 'explore_village');
  const { questState: s2 } = onRoomEnter(s1, 'center');
  const { questState: s3 } = onRoomEnter(s2, 'n');
  const { questState: s4 } = onRoomEnter(s3, 's');
  state = s4;
  
  // Now accept marsh_mystery
  const { questState: s5, accepted } = acceptQuest(state, 'marsh_mystery');
  assert(accepted, 'marsh_mystery accepted after completing prerequisite');
  state = s5;
  
  // Complete EXPLORE objective first
  const exploreResult = onRoomEnter(state, 'sw');
  state = exploreResult.questState;
  assert(exploreResult.completedStages.length === 1, 'explore stage completed');
  
  // Now kill a wisp
  const killResult1 = onEnemyKill(state, 'wisp', 1);
  assert(killResult1.messages.length > 0, 'kill progress message returned');
  const wispProgress = killResult1.questState.questProgress['marsh_mystery'].objectiveProgress['defeat_wisps'];
  assert(wispProgress === 1, 'wisp kill count incremented');
  
  state = killResult1.questState;
  
  // Kill 2 more wisps to complete (need 3 total)
  const killResult2 = onEnemyKill(state, 'wisp', 2);
  assert(killResult2.completedObjectives.length === 1, 'objective completed after 3 kills');
  assert(killResult2.completedQuests.length === 1, 'quest completed');
}

// --- onEnemyKill - edge cases ---
console.log('\n--- onEnemyKill - edge cases ---');
{
  const state = initQuestState();
  
  const result1 = onEnemyKill(state, null);
  assert(result1.messages.length === 0, 'null enemyType returns empty');
  
  const result2 = onEnemyKill(state, 'slime');
  assert(result2.messages.length === 0, 'no active quest with slime objective');
}

// --- onNPCTalk - TALK objectives ---
console.log('\n--- onNPCTalk - TALK objectives ---');
{
  let state = initQuestState();
  const { questState: accepted } = acceptQuest(state, 'grove_guardian');
  state = accepted;

  const { questState: afterExplore } = onRoomEnter(state, 'nw');
  state = afterExplore;

  const talkResult = onNPCTalk(state, 'forest_spirit');
  const progress = talkResult.questState.questProgress['grove_guardian'];

  assert(progress.objectiveProgress['talk_guardian'] === true, 'talk objective marked complete');
  assert(talkResult.completedObjectives.length === 1, 'one objective completed via talk');
  assert(talkResult.completedQuests.length === 0, 'quest not complete until delivery');
}

// --- onNPCTalk - edge cases ---
console.log('\n--- onNPCTalk - edge cases ---');
{
  const state = initQuestState();
  const result = onNPCTalk(state, null);
  assert(result.messages.length === 0, 'null npcId returns empty messages');
  assert(result.completedObjectives.length === 0, 'null npcId completes nothing');
}

// --- getQuestProgress ---
console.log('\n--- getQuestProgress ---');
{
  let state = initQuestState();
  
  // No progress for unstarted quest
  const progress1 = getQuestProgress(state, 'explore_village');
  assert(progress1 === null, 'null for unstarted quest');
  
  // Accept quest
  const { questState } = acceptQuest(state, 'explore_village');
  state = questState;
  
  const progress2 = getQuestProgress(state, 'explore_village');
  assert(progress2 !== null, 'progress exists for active quest');
  assert(progress2.isActive === true, 'isActive is true');
  assert(progress2.isComplete === false, 'isComplete is false');
  assert(progress2.stageIndex === 0, 'stageIndex starts at 0');
  assert(progress2.questName === 'Know Your Surroundings', 'questName is correct');
}

// --- getAvailableQuestsInRoom ---
console.log('\n--- getAvailableQuestsInRoom ---');
{
  let state = initQuestState();
  
  // Center room should have explore_village available
  const available1 = getAvailableQuestsInRoom(state, 'center');
  assert(available1.length > 0, 'center has available quests');
  assert(available1.some(q => q.id === 'explore_village'), 'explore_village available in center');
  
  // Accept the quest
  const { questState } = acceptQuest(state, 'explore_village');
  state = questState;
  
  // Quest no longer available after accepting
  const available2 = getAvailableQuestsInRoom(state, 'center');
  assert(!available2.some(q => q.id === 'explore_village'), 'explore_village not available after accepting');
}

// --- getActiveQuestsSummary ---
console.log('\n--- getActiveQuestsSummary ---');
{
  let state = initQuestState();
  
  const summary1 = getActiveQuestsSummary(state);
  assert(summary1.length === 0, 'no active quests initially');
  
  // Accept explore_village
  const { questState: s1 } = acceptQuest(state, 'explore_village');
  
  // Accept world_tour (no prerequisites)
  const { questState: s2 } = acceptQuest(s1, 'world_tour');
  
  const summary2 = getActiveQuestsSummary(s2);
  assert(summary2.length === 2, 'two active quests');
  assert(summary2.some(q => q.questId === 'explore_village'), 'explore_village in summary');
  assert(summary2.some(q => q.questId === 'world_tour'), 'world_tour in summary');
}

// --- applyQuestRewards ---
console.log('\n--- applyQuestRewards ---');
{
  const player = { hp: 100, gold: 50, xp: 0, inventory: {} };
  
  const rewards = {
    experience: 100,
    gold: 25,
    items: ['health_potion', 'explorers_badge']
  };
  
  const result = applyQuestRewards(player, rewards);
  assert(result.playerState.xp === 100, 'xp added');
  assert(result.playerState.gold === 75, 'gold added');
  assert(result.playerState.inventory['health_potion'] === 1, 'health_potion added');
  assert(result.playerState.inventory['explorers_badge'] === 1, 'explorers_badge added');
  assert(result.messages.length === 4, 'four reward messages');
}

// --- applyQuestRewards - null rewards ---
console.log('\n--- applyQuestRewards - edge cases ---');
{
  const player = { hp: 100, gold: 50 };
  
  const result1 = applyQuestRewards(player, null);
  assert(result1.playerState.gold === 50, 'gold unchanged with null rewards');
  
  const result2 = applyQuestRewards(player, {});
  assert(result2.messages.length === 0, 'no messages for empty rewards');
}

// --- Full quest flow test ---
console.log('\n--- Full Quest Flow ---');
{
  let state = initQuestState();
  
  // Accept explore_village
  const { questState: state2, accepted } = acceptQuest(state, 'explore_village');
  assert(accepted, 'quest accepted');
  state = state2;
  
  // Visit center
  const r1 = onRoomEnter(state, 'center');
  assert(r1.completedStages.length === 1, 'first stage completed');
  state = r1.questState;
  
  // Visit north
  const r2 = onRoomEnter(state, 'n');
  state = r2.questState;
  
  // Visit south (completes quest)
  const r3 = onRoomEnter(state, 's');
  assert(r3.completedQuests.length === 1, 'quest completed');
  assert(r3.completedQuests[0].rewards !== undefined, 'rewards returned');
  
  // Apply rewards
  const player = { hp: 100, xp: 0, gold: 0, inventory: {} };
  const { playerState, messages } = applyQuestRewards(player, r3.completedQuests[0].rewards);
  assert(playerState.xp === 25, 'xp reward applied (explore_village gives 25)');
  assert(playerState.gold === 10, 'gold reward applied (explore_village gives 10)');
}

// --- onNPCDeliver ---
console.log('\n--- onNPCDeliver ---');
{
  // Test 1: no-op when npcId is null
  const state1 = initQuestState();
  const result1 = onNPCDeliver(state1, null, {});
  assert(result1.messages.length === 0, 'no messages when npcId is null');
  assert(result1.itemsConsumed.length === 0, 'no items consumed when npcId is null');

  // Test 2: no-op when player does not have required item
  let state2 = initQuestState();
  const { questState: state2Accepted } = acceptQuest(state2, 'grove_guardian');
  const { questState: state2Stage } = onRoomEnter(state2Accepted, 'nw');
  state2 = state2Stage;
  const result2 = onNPCDeliver(state2, 'forest_spirit', {});
  assert(result2.messages.length === 0, 'no completion message when item missing');
  assert(result2.itemsConsumed.length === 0, 'no items consumed when item missing');
  assert(result2.completedObjectives.length === 0, 'objective not completed when item missing');

  // Test 3: completes DELIVER objective and returns itemsConsumed when player has required item
  let state3 = initQuestState();
  const { questState: state3Accepted } = acceptQuest(state3, 'grove_guardian');
  const { questState: state3Stage } = onRoomEnter(state3Accepted, 'nw');
  const { questState: state3Talk } = onNPCTalk(state3Stage, 'forest_spirit');
  state3 = state3Talk;
  const result3 = onNPCDeliver(state3, 'forest_spirit', { forest_herb: 1 });
  assert(result3.messages.length > 0, 'completion message returned when item present');
  assert(result3.messages[0].startsWith('✓'), 'completion message starts with checkmark');
  assert(result3.itemsConsumed.length === 1, 'one item consumed');
  assert(result3.itemsConsumed[0].itemId === 'forest_herb', 'consumed forest_herb');
  assert(result3.itemsConsumed[0].quantity === 1, 'consumed quantity is 1');
  assert(result3.completedObjectives.length === 1, 'deliver objective completed');
  assert(result3.questState.completedQuests.includes('grove_guardian'), 'quest completes after delivery');

  // Test 4: does not re-trigger when objective already complete
  const result4 = onNPCDeliver(result3.questState, 'forest_spirit', { forest_herb: 1 });
  assert(result4.itemsConsumed.length === 0, 'no items consumed after completion');
  assert(result4.messages.length === 0, 'no duplicate messages after completion');

  // Test 5: supports itemIds array shape (plural)
  const arrayQuestId = 'test_array_deliver';
  EXPLORATION_QUESTS[arrayQuestId] = {
    id: arrayQuestId,
    name: 'Array Deliver',
    description: 'Deliver multiple items.',
    type: 'SIDE',
    level: 1,
    stages: [
      {
        id: 'stage1',
        name: 'Stage1',
        description: 'Deliver items',
        objectives: [
          {
            id: 'obj1',
            type: 'DELIVER',
            description: 'Deliver items',
            itemIds: ['forest_herb', 'healing_potion'],
            required: true,
            targetNpcId: 'merchant_npc'
          }
        ],
        nextStage: null
      }
    ],
    rewards: { experience: 20, gold: 0, items: [] },
    prerequisites: []
  };

  let state5 = initQuestState();
  const { questState: state5Accepted } = acceptQuest(state5, arrayQuestId);
  state5 = state5Accepted;

  const result5a = onNPCDeliver(state5, 'merchant_npc', { forest_herb: 1 });
  assert(result5a.completedObjectives.length === 0, 'array deliver not complete with one item');
  assert(result5a.itemsConsumed.length === 0, 'no items consumed with incomplete items');

  const result5b = onNPCDeliver(state5, 'merchant_npc', { forest_herb: 1, healing_potion: 1 });
  assert(result5b.completedObjectives.length === 1, 'array deliver completes with all items');
  assert(result5b.itemsConsumed.length === 2, 'both items consumed');
  assert(result5b.itemsConsumed[0].itemId === 'forest_herb', 'first consumed item is forest_herb');
  assert(result5b.itemsConsumed[1].itemId === 'healing_potion', 'second consumed item is healing_potion');
  assert(result5b.questState.completedQuests.includes(arrayQuestId), 'array deliver quest completes');

  delete EXPLORATION_QUESTS[arrayQuestId];

  // Test 6: does not complete if wrong NPC
  let state6 = initQuestState();
  const { questState: state6Accepted } = acceptQuest(state6, 'grove_guardian');
  const { questState: state6Stage } = onRoomEnter(state6Accepted, 'nw');
  state6 = state6Stage;
  const result6 = onNPCDeliver(state6, 'wrong_npc', { forest_herb: 1 });
  assert(result6.completedObjectives.length === 0, 'no completion for wrong NPC');
}

// --- Summary ---
console.log('\n========================================');
console.log(`Quest Integration Tests: ${passed} passed, ${failed} failed`);
console.log('========================================');

process.exit(failed > 0 ? 1 : 0);
