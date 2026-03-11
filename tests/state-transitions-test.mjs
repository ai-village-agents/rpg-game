import test from 'node:test';
import assert from 'node:assert';
import { handleStateTransitions } from '../src/state-transitions.js';

test('handleStateTransitions - no level up, no victory transition', () => {
  const prevState = { phase: 'combat', log: [] };
  const nextState = { phase: 'combat', log: [], player: { xp: 10, hp: 100, maxHp: 100, level: 1 } };
  const result = handleStateTransitions(prevState, nextState);
  assert.strictEqual(result.phase, 'combat');
  assert.strictEqual(result.player.level, 1);
});

test('handleStateTransitions - transitions victory to battle-summary', () => {
  const prevState = { phase: 'combat', log: [] };
  const nextState = { phase: 'victory', log: [], player: { xp: 10, hp: 100, maxHp: 100, level: 1 } };
  const result = handleStateTransitions(prevState, nextState);
  assert.strictEqual(result.phase, 'battle-summary');
  assert.ok(result.battleSummary); 
});

test('handleStateTransitions - level up during victory transition', () => {
  const prevState = { phase: 'combat', log: [] };
  const nextState = { 
    phase: 'victory', 
    log: [],
    xpGained: 50,
    player: { 
      name: 'Hero',
      xp: 100, 
      hp: 100, 
      level: 1, 
      classId: 'warrior',
      stats: { hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 10, def: 10, spd: 5, int: 5, lck: 5 }
    } 
  };
  const result = handleStateTransitions(prevState, nextState);
  
  assert.strictEqual(result.phase, 'battle-summary'); 
  assert.strictEqual(result.player.level, 2);
  assert.ok(result.player.maxHp > 100); 
  assert.ok(result.log.some(log => log.includes('reached level 2!')));
});

test('handleStateTransitions - multiple level ups during victory transition', () => {
    const prevState = { phase: 'combat', log: [] };
    const nextState = { 
      phase: 'victory', 
      log: [],
      xpGained: 950,
      player: { 
        name: 'MageHero',
        xp: 1000, 
        hp: 100, 
        level: 1, 
        classId: 'mage',
        stats: { hp: 100, maxHp: 100, mp: 50, maxMp: 50, atk: 5, def: 5, spd: 5, int: 15, lck: 5 }
      } 
    };
    const result = handleStateTransitions(prevState, nextState);
    
    assert.strictEqual(result.phase, 'battle-summary');
    assert.ok(result.player.level > 2);
    assert.ok(result.log.some(log => log.includes(`reached level ${result.player.level}!`)));
  });

test('handleStateTransitions - does not transition to battle-summary if already in battle-summary', () => {
    const prevState = { phase: 'battle-summary', log: [] };
    const nextState = { phase: 'victory', log: [], player: { xp: 10, hp: 100, maxHp: 100, level: 1 } };
    const result = handleStateTransitions(prevState, nextState);
    assert.strictEqual(result.phase, 'victory'); 
});

test('handleStateTransitions - does not transition to battle-summary if previously in level-up', () => {
    const prevState = { phase: 'level-up', log: [] };
    const nextState = { phase: 'victory', log: [], player: { xp: 10, hp: 100, maxHp: 100, level: 1 } };
    const result = handleStateTransitions(prevState, nextState);
    assert.strictEqual(result.phase, 'victory');
});

