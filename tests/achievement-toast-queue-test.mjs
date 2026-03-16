import test from 'node:test';
import assert from 'node:assert/strict';
import { selectUniqueAchievementToastEntries } from '../src/render.js';

test('selectUniqueAchievementToastEntries dedupes by id already in-flight and within batch', () => {
  const notifications = [
    { id: 'first_blood', name: 'First Blood' },
    { id: 'first_blood', name: 'First Blood Duplicate' },
    { id: 'boss_hunter', name: 'Boss Hunter' },
    { id: 'legendary', name: 'Legendary' },
    { id: 'legendary', name: 'Legendary Duplicate' }
  ];
  const inFlight = new Set(['boss_hunter']);

  const queued = selectUniqueAchievementToastEntries(notifications, inFlight);

  assert.deepEqual(
    queued.map((entry) => entry.id),
    ['first_blood', 'legendary']
  );
  assert.equal(queued[0].name, 'First Blood');
  assert.equal(queued[1].name, 'Legendary');
});

test('selectUniqueAchievementToastEntries keeps id-less entries', () => {
  const notifications = [
    { name: 'No ID 1' },
    { name: 'No ID 2' }
  ];

  const queued = selectUniqueAchievementToastEntries(notifications, new Set());

  assert.equal(queued.length, 2);
  assert.equal(queued[0].id, undefined);
  assert.equal(queued[1].id, undefined);
});
