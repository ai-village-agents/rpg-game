import { describe, test } from 'node:test';
import assert from 'node:assert';
import { renderBossTelegraphPanel, getBossTelegraphStyles } from '../src/boss-telegraph-ui.js';

const validState = {
  phase: 'player-turn',
  rngSeed: 12345,
  enemy: {
    atk: 15,
    mp: 30,
    maxMp: 50,
    abilities: [],
    aiBehavior: 'basic',
    hp: 50,
    maxHp: 100,
    isBoss: false,
    name: 'Slime',
  },
};

const bossState = {
  phase: 'player-turn',
  rngSeed: 99999,
  enemy: {
    atk: 20,
    mp: 60,
    maxMp: 60,
    abilities: ['vine-whip', 'nature-shield'],
    aiBehavior: 'basic',
    hp: 80,
    maxHp: 150,
    isBoss: true,
    currentPhase: 1,
    currentHp: 80,
    phases: [
      { phase: 1, name: 'Awakening', hpThreshold: 1.0 },
      { phase: 2, name: 'Enraged', hpThreshold: 0.5 },
    ],
    name: 'Forest Guardian',
  },
};

const bossNearThreshold = {
  ...bossState,
  enemy: {
    ...bossState.enemy,
    hp: 84,
    currentHp: 84,
  },
};

describe('getBossTelegraphStyles', () => {
  test('returns a non-empty string', () => {
    const styles = getBossTelegraphStyles();
    assert.strictEqual(typeof styles, 'string');
    assert.ok(styles.length > 0);
  });

  test('contains telegraph-pulse keyframes', () => {
    const styles = getBossTelegraphStyles();
    assert.ok(styles.includes('telegraph-pulse'));
  });

  test('contains reduced-motion media query', () => {
    const styles = getBossTelegraphStyles();
    assert.ok(styles.includes('prefers-reduced-motion'));
  });

  test('contains boss-telegraph-panel class definition', () => {
    const styles = getBossTelegraphStyles();
    assert.ok(styles.includes('.boss-telegraph-panel'));
  });
});

describe('renderBossTelegraphPanel', () => {
  test('returns empty string when phase is not player-turn', () => {
    const html = renderBossTelegraphPanel({ ...validState, phase: 'enemy-turn' });
    assert.strictEqual(html, '');
  });

  test('returns empty string when no enemy', () => {
    const html = renderBossTelegraphPanel({ phase: 'player-turn' });
    assert.strictEqual(html, '');
  });

  test('returns empty string when enemy.hp <= 0', () => {
    const html = renderBossTelegraphPanel({ ...validState, enemy: { ...validState.enemy, hp: 0 } });
    assert.strictEqual(html, '');
  });

  test('returns HTML string for valid state', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.length > 0);
  });

  test('rendered HTML contains boss-telegraph-panel class', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('boss-telegraph-panel'));
  });

  test('rendered HTML contains Enemy Intent text', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('Enemy Intent'));
  });

  test('rendered HTML includes urgency class', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('telegraph-urgency-'));
  });

  test('for boss enemy, HTML contains phase info text', () => {
    const html = renderBossTelegraphPanel(bossState);
    assert.ok(html.includes('Phase 1 of 2'));
  });

  test('for boss near threshold, HTML contains phase transition text', () => {
    const html = renderBossTelegraphPanel(bossNearThreshold);
    assert.ok(html.includes('Phase transition'));
  });

  test('boss HP bar container is rendered for boss', () => {
    const html = renderBossTelegraphPanel(bossState);
    assert.ok(html.includes('boss-phase-bar-container'));
  });

  test('boss phase markers are rendered for boss', () => {
    const html = renderBossTelegraphPanel(bossState);
    assert.ok(html.includes('boss-phase-marker'));
  });

  test('telegraph description is present', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('telegraph-description'));
  });

  test('telegraph label is present', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('telegraph-label'));
  });

  test('telegraph icon is present', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('telegraph-icon'));
  });

  test('urgency badge is present', () => {
    const html = renderBossTelegraphPanel(validState);
    assert.ok(html.includes('telegraph-urgency-badge'));
  });
});
