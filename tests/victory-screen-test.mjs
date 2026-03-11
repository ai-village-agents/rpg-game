import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CREDITS,
  calculateRating,
  formatPlayTime,
  renderVictoryScreen,
  renderVictoryActions,
  createNewGamePlusState,
  getVictoryScreenStyles,
} from '../src/victory-screen.js';

// ─── CREDITS ───

describe('CREDITS', () => {
  it('is an array with at least 12 entries', () => {
    assert.ok(Array.isArray(CREDITS));
    assert.ok(CREDITS.length >= 12);
  });

  it('includes all 12 AI Village agents', () => {
    const names = CREDITS.map(c => c.name);
    const agents = [
      'Claude Opus 4.6', 'Claude Opus 4.5', 'Claude Sonnet 4.6',
      'Claude Sonnet 4.5', 'Claude Haiku 4.5', 'Opus 4.5 (Claude Code)',
      'GPT-5', 'GPT-5.1', 'GPT-5.2',
      'Gemini 2.5 Pro', 'Gemini 3.1 Pro', 'DeepSeek-V3.2',
    ];
    for (const agent of agents) {
      assert.ok(names.includes(agent), `Missing agent: ${agent}`);
    }
  });

  it('includes AI Digest project credit', () => {
    const names = CREDITS.map(c => c.name);
    assert.ok(names.some(n => n.includes('AI Digest')));
  });

  it('has divider entries', () => {
    assert.ok(CREDITS.some(c => c.name === '—'));
  });
});

// ─── calculateRating ───

describe('calculateRating', () => {
  it('returns C/Adventurer for null inputs', () => {
    const r = calculateRating(null, null);
    assert.equal(r.grade, 'C');
    assert.equal(r.title, 'Adventurer');
  });

  it('returns C/Adventurer for undefined inputs', () => {
    const r = calculateRating(undefined, undefined);
    assert.equal(r.grade, 'C');
    assert.equal(r.title, 'Adventurer');
  });

  it('returns D/Survivor for minimal stats', () => {
    const r = calculateRating(
      { enemiesDefeated: 0, totalDamageDealt: 0, totalDamageReceived: 100, battlesWon: 0, battlesFled: 0, weaknessHits: 0, shieldsBroken: 0 },
      { level: 1 }
    );
    assert.equal(r.grade, 'D');
    assert.equal(r.title, 'Survivor');
  });

  it('returns S/Legendary Champion for high stats', () => {
    const r = calculateRating(
      { enemiesDefeated: 200, totalDamageDealt: 50000, totalDamageReceived: 5000, battlesWon: 100, battlesFled: 0, weaknessHits: 50, shieldsBroken: 30 },
      { level: 25 }
    );
    assert.equal(r.grade, 'S');
    assert.equal(r.title, 'Legendary Champion');
  });

  it('returns A/Master Slayer for good stats', () => {
    const r = calculateRating(
      { enemiesDefeated: 30, totalDamageDealt: 9000, totalDamageReceived: 3000, battlesWon: 30, battlesFled: 0, weaknessHits: 15, shieldsBroken: 10 },
      { level: 12 }
    );
    assert.equal(r.grade, 'A');
    assert.equal(r.title, 'Master Slayer');
  });

  it('returns B/Seasoned Warrior for moderate stats', () => {
    const r = calculateRating(
      { enemiesDefeated: 20, totalDamageDealt: 4000, totalDamageReceived: 2000, battlesWon: 20, battlesFled: 3, weaknessHits: 10, shieldsBroken: 5 },
      { level: 10 }
    );
    assert.equal(r.grade, 'B');
    assert.equal(r.title, 'Seasoned Warrior');
  });

  it('handles zero damage received (infinite ratio capped)', () => {
    const r = calculateRating(
      { enemiesDefeated: 10, totalDamageDealt: 5000, totalDamageReceived: 0, battlesWon: 10, battlesFled: 0, weaknessHits: 0, shieldsBroken: 0 },
      { level: 5 }
    );
    assert.ok(['S', 'A', 'B', 'C'].includes(r.grade));
  });

  it('penalizes high flee ratio', () => {
    const highFlee = calculateRating(
      { enemiesDefeated: 30, totalDamageDealt: 5000, totalDamageReceived: 3000, battlesWon: 10, battlesFled: 20, weaknessHits: 5, shieldsBroken: 2 },
      { level: 10 }
    );
    const lowFlee = calculateRating(
      { enemiesDefeated: 30, totalDamageDealt: 5000, totalDamageReceived: 3000, battlesWon: 30, battlesFled: 0, weaknessHits: 5, shieldsBroken: 2 },
      { level: 10 }
    );
    const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    assert.ok(gradeOrder[lowFlee.grade] >= gradeOrder[highFlee.grade], 'Lower flee should give equal or better grade');
  });

  it('rewards weakness exploitation', () => {
    const noWeakness = calculateRating(
      { enemiesDefeated: 50, totalDamageDealt: 10000, totalDamageReceived: 5000, battlesWon: 50, battlesFled: 0, weaknessHits: 0, shieldsBroken: 0 },
      { level: 10 }
    );
    const highWeakness = calculateRating(
      { enemiesDefeated: 50, totalDamageDealt: 10000, totalDamageReceived: 5000, battlesWon: 50, battlesFled: 0, weaknessHits: 50, shieldsBroken: 0 },
      { level: 10 }
    );
    const gradeOrder = { S: 5, A: 4, B: 3, C: 2, D: 1 };
    assert.ok(gradeOrder[highWeakness.grade] >= gradeOrder[noWeakness.grade]);
  });

  it('always returns an object with grade and title', () => {
    const r = calculateRating({}, {});
    assert.ok(typeof r.grade === 'string');
    assert.ok(typeof r.title === 'string');
    assert.ok(r.grade.length >= 1);
    assert.ok(r.title.length >= 1);
  });
});

// ─── formatPlayTime ───

describe('formatPlayTime', () => {
  it('returns "0m 0s" for 0 seconds', () => {
    assert.equal(formatPlayTime(0), '0m 0s');
  });

  it('returns "0m 0s" for null', () => {
    assert.equal(formatPlayTime(null), '0m 0s');
  });

  it('returns "0m 0s" for undefined', () => {
    assert.equal(formatPlayTime(undefined), '0m 0s');
  });

  it('returns "0m 0s" for negative values', () => {
    assert.equal(formatPlayTime(-100), '0m 0s');
  });

  it('formats seconds only', () => {
    assert.equal(formatPlayTime(45), '0m 45s');
  });

  it('formats minutes and seconds', () => {
    assert.equal(formatPlayTime(125), '2m 5s');
  });

  it('formats hours minutes seconds', () => {
    assert.equal(formatPlayTime(3723), '1h 2m 3s');
  });

  it('formats exactly one hour', () => {
    assert.equal(formatPlayTime(3600), '1h 0m 0s');
  });

  it('formats large values', () => {
    assert.equal(formatPlayTime(36000), '10h 0m 0s');
  });

  it('floors fractional seconds', () => {
    assert.equal(formatPlayTime(65.9), '1m 5s');
  });
});

// ─── renderVictoryScreen ───

describe('renderVictoryScreen', () => {
  function makeState(overrides = {}) {
    return {
      player: { name: 'TestHero', level: 15, className: 'Warrior', maxHp: 100, maxMp: 30, hp: 100, mp: 30 },
      gameStats: { enemiesDefeated: 50, battlesWon: 45, totalDamageDealt: 10000, totalDamageReceived: 4000, goldEarned: 5000, xpEarned: 8000, abilitiesUsed: 200, turnsPlayed: 500, shieldsBroken: 10, weaknessHits: 15, battlesFled: 2 },
      dungeonState: { floorsCleared: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14] },
      inventory: new Array(20).fill({ id: 'item' }),
      playTimeSeconds: 7200,
      specializationState: { selectedSpec: 'Berserker' },
      ...overrides,
    };
  }

  it('returns HTML string containing GAME COMPLETE', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('GAME COMPLETE'));
  });

  it('contains the player name', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('TestHero'));
  });

  it('contains the player class', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('Warrior'));
  });

  it('contains the specialization name', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('Berserker'));
  });

  it('contains floor count', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('15 / 15'));
  });

  it('contains enemies defeated count', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('50'));
  });

  it('contains rating grade', () => {
    const html = renderVictoryScreen(makeState());
    // Should be at least some grade letter
    assert.ok(/victory-grade-[sabcd]/.test(html));
  });

  it('contains credits section', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('Credits'));
    assert.ok(html.includes('AI Village'));
  });

  it('contains star fanfare elements', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('victory-star'));
    assert.ok(html.includes('victory-fanfare'));
  });

  it('contains play time formatted', () => {
    const html = renderVictoryScreen(makeState());
    assert.ok(html.includes('2h 0m 0s'));
  });

  it('handles empty state gracefully', () => {
    const html = renderVictoryScreen({});
    assert.ok(typeof html === 'string');
    assert.ok(html.includes('GAME COMPLETE'));
  });

  it('handles missing player name', () => {
    const html = renderVictoryScreen(makeState({ player: { level: 1 } }));
    assert.ok(html.includes('Hero')); // Default fallback
  });

  it('uses player.class when className missing', () => {
    const html = renderVictoryScreen(makeState({ player: { name: 'Tester', level: 5, class: 'Mage' } }));
    assert.ok(html.includes('Mage'));
  });

  it('handles missing specialization', () => {
    const html = renderVictoryScreen(makeState({ specializationState: null }));
    assert.ok(typeof html === 'string');
    // No error thrown
  });

  it('escapes HTML in player name', () => {
    const html = renderVictoryScreen(makeState({ player: { name: '<script>alert(1)</script>', level: 1 } }));
    assert.ok(!html.includes('<script>'));
    assert.ok(html.includes('&lt;script&gt;'));
  });

  it('shows 0 for missing gameStats fields', () => {
    const html = renderVictoryScreen(makeState({ gameStats: {} }));
    // Should show "0" for various stats without errors
    assert.ok(typeof html === 'string');
  });
});

// ─── renderVictoryActions ───

describe('renderVictoryActions', () => {
  it('returns HTML with New Game + button', () => {
    const html = renderVictoryActions();
    assert.ok(html.includes('btnNewGamePlus'));
    assert.ok(html.includes('New Game +'));
  });

  it('returns HTML with Return to Title button', () => {
    const html = renderVictoryActions();
    assert.ok(html.includes('btnReturnTitle'));
    assert.ok(html.includes('Return to Title'));
  });

  it('wraps buttons in .buttons div', () => {
    const html = renderVictoryActions();
    assert.ok(html.includes('class="buttons"'));
  });
});

// ─── createNewGamePlusState ───

describe('createNewGamePlusState', () => {
  function makePrevState() {
    return {
      player: { name: 'Hero', level: 20, maxHp: 200, maxMp: 50, hp: 150, mp: 30, className: 'Warrior', attack: 25, defense: 20, defending: true },
      gold: 1000,
      inventory: [
        { id: 'sword', equipped: true },
        { id: 'potion', equipped: false },
        { id: 'armor', equipped: true },
      ],
      newGamePlusCount: 0,
      gameStats: { enemiesDefeated: 100 },
      bestiary: { slime: true },
      tutorialState: { completedSteps: ['welcome'], hintsEnabled: true },
      questState: { active: ['q1'] },
      dungeonState: { floor: 14 },
      visitedRooms: ['village'],
      weatherState: { current: 'rain' },
      worldEvent: { id: 'storm' },
      companions: [{ id: 'ally1' }],
    };
  }

  it('sets phase to exploration', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.phase, 'exploration');
  });

  it('restores player HP to max', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.player.hp, 200);
    assert.equal(ng.player.mp, 50);
  });

  it('sets defending to false', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.player.defending, false);
  });

  it('preserves player level and name', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.player.level, 20);
    assert.equal(ng.player.name, 'Hero');
  });

  it('gives 50% of previous gold', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.gold, 500);
  });

  it('keeps only equipped items', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.inventory.length, 2);
    assert.ok(ng.inventory.every(i => i.equipped));
  });

  it('increments newGamePlusCount', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.newGamePlusCount, 1);
    assert.equal(ng.newGamePlusBonus, 1);
    assert.equal(ng.newGamePlus, true);
  });

  it('increments from existing NG+ count', () => {
    const prev = makePrevState();
    prev.newGamePlusCount = 3;
    const ng = createNewGamePlusState(prev);
    assert.equal(ng.newGamePlusCount, 4);
  });

  it('preserves gameStats', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.deepEqual(ng.gameStats, { enemiesDefeated: 100 });
  });

  it('preserves bestiary', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.deepEqual(ng.bestiary, { slime: true });
  });

  it('preserves tutorialState', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.ok(ng.tutorialState);
    assert.ok(ng.tutorialState.completedSteps.includes('welcome'));
  });

  it('resets questState', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.questState, undefined);
  });

  it('resets dungeonState', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.dungeonState, undefined);
  });

  it('resets visitedRooms', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.visitedRooms, undefined);
  });

  it('resets weatherState', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.weatherState, undefined);
  });

  it('resets worldEvent', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.equal(ng.worldEvent, undefined);
  });

  it('clears companions', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.deepEqual(ng.companions, []);
  });

  it('has log messages about NG+', () => {
    const ng = createNewGamePlusState(makePrevState());
    assert.ok(ng.log.length >= 1);
    assert.ok(ng.log[0].includes('New Game+'));
  });

  it('handles empty prevState gracefully', () => {
    const ng = createNewGamePlusState({});
    assert.equal(ng.phase, 'exploration');
    assert.equal(ng.newGamePlusCount, 1);
    assert.equal(ng.gold, 0);
    assert.deepEqual(ng.inventory, []);
  });
});

// ─── getVictoryScreenStyles ───

describe('getVictoryScreenStyles', () => {
  it('returns a non-empty string', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(typeof styles === 'string');
    assert.ok(styles.length > 100);
  });

  it('contains victory-screen class', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(styles.includes('.victory-screen'));
  });

  it('contains victory-grade classes', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(styles.includes('.victory-grade-s'));
    assert.ok(styles.includes('.victory-grade-a'));
    assert.ok(styles.includes('.victory-grade-b'));
    assert.ok(styles.includes('.victory-grade-c'));
    assert.ok(styles.includes('.victory-grade-d'));
  });

  it('contains keyframe animations', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(styles.includes('@keyframes victory-sparkle'));
    assert.ok(styles.includes('@keyframes victory-glow'));
  });

  it('contains stats grid styles', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(styles.includes('.victory-stats-grid'));
    assert.ok(styles.includes('.victory-stat-card'));
  });

  it('contains credits styles', () => {
    const styles = getVictoryScreenStyles();
    assert.ok(styles.includes('.victory-credits'));
    assert.ok(styles.includes('.victory-credit-entry'));
  });
});
