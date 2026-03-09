import assert from 'assert/strict';

// Data modules
import { NPCS } from '../src/data/npcs.js';
import { ENEMIES } from '../src/data/enemies.js';
import { QUESTS } from '../src/data/quests.js';
import { EXPLORATION_QUESTS } from '../src/data/exploration-quests.js';

function has(obj, k) { return Object.prototype.hasOwnProperty.call(obj, k); }

// Build consolidated lookup for exploration locations from all known sources.
const ALL_LOCATIONS = new Set(Object.keys(EXPLORATION_QUESTS || {}));
for (const quest of Object.values(QUESTS || {})) {
  const stages = Array.isArray(quest?.stages) ? quest.stages : [];
  stages.forEach(stage => {
    const objectives = Array.isArray(stage?.objectives) ? stage.objectives : [];
    objectives.forEach(obj => {
      if (obj && typeof obj.locationId === 'string' && obj.locationId.length > 0) {
        ALL_LOCATIONS.add(obj.locationId);
      }
    });
  });
}

function assertNpcExists(npcId, ctx) {
  assert.ok(npcId && has(NPCS, npcId), `Missing NPC \"${npcId}\" referenced by ${ctx}`);
}

function assertEnemyExists(enemyId, ctx) {
  assert.ok(enemyId && has(ENEMIES, enemyId), `Missing enemy \"${enemyId}\" referenced by ${ctx}`);
}

function validateExploreLocation(id, ctx) {
  // If we have a registry of locations, ensure it appears there; otherwise ensure it looks like a non-empty string.
  if (ALL_LOCATIONS.size > 0) {
    assert.ok(ALL_LOCATIONS.has(id), `Unknown explore location \"${id}\" referenced by ${ctx}`);
  } else {
    assert.ok(typeof id === 'string' && id.length > 0, `Invalid explore location for ${ctx}`);
  }
}

function get(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

for (const [questId, quest] of Object.entries(QUESTS)) {
  const stages = Array.isArray(quest?.stages) ? quest.stages : [];
  stages.forEach((stage, si) => {
    const objs = Array.isArray(stage?.objectives) ? stage.objectives : [];
    objs.forEach((objective, oi) => {
      const type = objective?.type;
      const ctx = `quest:${questId} stage:${si} objective:${oi} (type:${type})`;
      if (type === 'TALK') {
        const npcId = get(objective, ['npcId', 'id', 'target']);
        assertNpcExists(npcId, ctx);
      } else if (type === 'KILL' || type === 'DEFEAT') {
        const enemyId = get(objective, ['enemyId', 'enemy', 'target', 'enemyType']);
        assertEnemyExists(enemyId, ctx);
      } else if (type === 'EXPLORE') {
        const locId = get(objective, ['locationId', 'location', 'room']);
        validateExploreLocation(locId, ctx);
      }
    });
  });
}

console.log('quest-integrity: ok');
