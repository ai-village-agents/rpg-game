import { test, assert } from './utils.js';
import { handleSystemAction } from '../src/handlers/system-handler.js';

test('class selection moves to background selection phase', () => {
  const start = { phase: 'class-select', log: [] };
  const afterClass = handleSystemAction(start, { type: 'SELECT_CLASS', classId: 'warrior' });

  assert(afterClass.phase === 'background-select', 'should enter background-select phase after choosing class');
  assert(afterClass.player.classId === 'warrior', 'player keeps selected classId');
});

test('background selection applies bonuses and enters exploration', () => {
  const afterClass = handleSystemAction({ phase: 'class-select', log: [] }, { type: 'SELECT_CLASS', classId: 'warrior' });
  const baseAtk = afterClass.player.atk;
  const basePotions = afterClass.player.inventory?.potion || 0;

  const afterBackground = handleSystemAction(afterClass, { type: 'SELECT_BACKGROUND', backgroundId: 'soldier' });

  assert(afterBackground.phase === 'exploration', 'should enter exploration after selecting background');
  assert(afterBackground.player.backgroundId === 'soldier', 'player stores chosen backgroundId');
  assert(afterBackground.player.atk === baseAtk + 2, 'soldier background adds to attack');
  assert(afterBackground.player.inventory.potion === basePotions + 1, 'soldier background adds potion to inventory');
  assert(afterBackground.visitedRooms !== undefined, 'visitedRooms initialized after background select');
  assert(afterBackground.gameStats !== undefined, 'gameStats initialized after background select');
});

test('background bonuses adjust gold values', () => {
  const afterClass = handleSystemAction({ phase: 'class-select', log: [] }, { type: 'SELECT_CLASS', classId: 'rogue' });
  const afterBackground = handleSystemAction(afterClass, { type: 'SELECT_BACKGROUND', backgroundId: 'wanderer' });

  assert(afterBackground.player.gold === 15, 'wanderer background grants starting gold');
});
