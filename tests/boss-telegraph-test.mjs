/**
 * Tests for Boss Move Telegraphing System
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  TELEGRAPH_TYPES,
  TELEGRAPH_SEVERITY,
  classifyAbilityType,
  determineSeverity,
  predictNextMove,
  generateWarningText,
  generateTacticalHint,
  getTelegraphSummary,
} from '../src/boss-telegraph.js';

import {
  renderTelegraphPanel,
  renderTelegraphIndicator,
  renderTelegraphTooltip,
  renderBossCombatTelegraph,
  getBossTelegraph,
  getTelegraphSummaryLine,
  getTelegraphStyles,
} from '../src/boss-telegraph-ui.js';

// ============ CONSTANTS TESTS ============

describe('TELEGRAPH_TYPES', () => {
  test('has all required types', () => {
    assert.ok(TELEGRAPH_TYPES.ATTACK);
    assert.ok(TELEGRAPH_TYPES.SPECIAL);
    assert.ok(TELEGRAPH_TYPES.BUFF);
    assert.ok(TELEGRAPH_TYPES.DEBUFF);
    assert.ok(TELEGRAPH_TYPES.HEAL);
    assert.ok(TELEGRAPH_TYPES.CHARGE);
  });
});

describe('TELEGRAPH_SEVERITY', () => {
  test('has all severity levels', () => {
    assert.ok(TELEGRAPH_SEVERITY.LOW);
    assert.ok(TELEGRAPH_SEVERITY.MEDIUM);
    assert.ok(TELEGRAPH_SEVERITY.HIGH);
    assert.ok(TELEGRAPH_SEVERITY.CRITICAL);
  });
});

// ============ CLASSIFY ABILITY TYPE TESTS ============

describe('classifyAbilityType', () => {
  test('returns ATTACK for null ability', () => {
    assert.strictEqual(classifyAbilityType(null), TELEGRAPH_TYPES.ATTACK);
  });

  test('returns BUFF for buff type', () => {
    const ability = { type: 'buff', power: 0 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.BUFF);
  });

  test('returns HEAL for heal type', () => {
    const ability = { type: 'heal', power: 20 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.HEAL);
  });

  test('returns DEBUFF for debuff type', () => {
    const ability = { type: 'debuff', power: 0 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.DEBUFF);
  });

  test('returns SPECIAL for drain type', () => {
    const ability = { type: 'drain', power: 25 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.SPECIAL);
  });

  test('returns ATTACK for low power physical', () => {
    const ability = { type: 'physical', power: 20 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.ATTACK);
  });

  test('returns SPECIAL for high power physical', () => {
    const ability = { type: 'physical', power: 50 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.SPECIAL);
  });

  test('returns ATTACK for low power magical', () => {
    const ability = { type: 'magical', power: 25 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.ATTACK);
  });

  test('returns SPECIAL for high power magical', () => {
    const ability = { type: 'magical', power: 45 };
    assert.strictEqual(classifyAbilityType(ability), TELEGRAPH_TYPES.SPECIAL);
  });
});

// ============ DETERMINE SEVERITY TESTS ============

describe('determineSeverity', () => {
  test('returns LOW for null inputs', () => {
    assert.strictEqual(determineSeverity(null, null, null), TELEGRAPH_SEVERITY.LOW);
  });

  test('returns LOW for buff abilities', () => {
    const ability = { type: 'buff', power: 0 };
    const boss = { atk: 20 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.LOW);
  });

  test('returns LOW for heal abilities', () => {
    const ability = { type: 'heal', power: 30 };
    const boss = { atk: 20 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.LOW);
  });

  test('returns LOW for weak attacks', () => {
    const ability = { type: 'physical', power: 10 };
    const boss = { atk: 10 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.LOW);
  });

  test('returns MEDIUM for moderate attacks', () => {
    // power=20, bossAtk=12 -> (20*12/10) - 2.5 = 24-2.5 = 21.5 -> ~22% damage
    const ability = { type: 'physical', power: 20 };
    const boss = { atk: 12 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.MEDIUM);
  });

  test('returns HIGH for strong attacks', () => {
    // power=35, bossAtk=15 -> (35*15/10) - 2.5 = 52.5-2.5 = 50 -> 50% damage -> CRITICAL
    // Try: power=30, bossAtk=12 -> (30*12/10) - 2.5 = 36-2.5 = 33.5 -> 33% damage -> HIGH
    const ability = { type: 'physical', power: 30 };
    const boss = { atk: 12 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.HIGH);
  });

  test('returns CRITICAL for devastating attacks', () => {
    const ability = { type: 'physical', power: 50 };
    const boss = { atk: 20 };
    const player = { hp: 100, maxHp: 100, def: 5 };
    assert.strictEqual(determineSeverity(ability, boss, player), TELEGRAPH_SEVERITY.CRITICAL);
  });
});

// ============ PREDICT NEXT MOVE TESTS ============

describe('predictNextMove', () => {
  test('returns default for null boss', () => {
    const result = predictNextMove(null);
    assert.strictEqual(result.ability, null);
    assert.strictEqual(result.confidence, 0.5);
    assert.strictEqual(result.type, TELEGRAPH_TYPES.ATTACK);
  });

  test('returns default for boss with no abilities', () => {
    const boss = { abilities: [] };
    const result = predictNextMove(boss);
    assert.strictEqual(result.ability, null);
    assert.strictEqual(result.type, TELEGRAPH_TYPES.ATTACK);
  });

  test('returns basic attack when no MP', () => {
    const boss = { abilities: ['fire-breath'], mp: 0 };
    const result = predictNextMove(boss);
    assert.strictEqual(result.ability, null);
    assert.strictEqual(result.confidence, 0.8);
  });

  test('returns prediction for aggressive boss', () => {
    const boss = {
      abilities: ['fire-breath', 'claw-slash'],
      mp: 100,
      aiBehavior: 'aggressive',
      atk: 15,
    };
    const result = predictNextMove(boss);
    assert.ok(result.ability);
    assert.ok(result.confidence >= 0.5);
  });

  test('returns prediction for caster boss', () => {
    const boss = {
      abilities: ['shadow-bolt', 'life-drain'],
      mp: 100,
      aiBehavior: 'caster',
      atk: 12,
    };
    const result = predictNextMove(boss);
    assert.ok(result.ability || result.ability === null);
    assert.ok(result.type);
  });

  test('includes abilityId in prediction', () => {
    const boss = {
      abilities: ['vine-whip'],
      mp: 100,
      aiBehavior: 'basic',
      atk: 10,
    };
    const result = predictNextMove(boss);
    if (result.ability) {
      assert.ok(result.abilityId);
    }
  });
});

// ============ GENERATE WARNING TEXT TESTS ============

describe('generateWarningText', () => {
  test('returns default for null prediction', () => {
    const result = generateWarningText(null, { name: 'TestBoss' });
    assert.strictEqual(result, 'TestBoss is preparing an attack...');
  });

  test('returns DANGER for critical severity', () => {
    const prediction = {
      ability: { name: 'Inferno' },
      severity: TELEGRAPH_SEVERITY.CRITICAL,
    };
    const result = generateWarningText(prediction, { name: 'Fire Drake' });
    assert.ok(result.includes('DANGER'));
    assert.ok(result.includes('Inferno'));
  });

  test('returns Warning for high severity', () => {
    const prediction = {
      ability: { name: 'Claw Slash' },
      severity: TELEGRAPH_SEVERITY.HIGH,
    };
    const result = generateWarningText(prediction, { name: 'Fire Drake' });
    assert.ok(result.includes('Warning'));
  });

  test('returns neutral for medium severity', () => {
    const prediction = {
      ability: { name: 'Vine Whip' },
      severity: TELEGRAPH_SEVERITY.MEDIUM,
    };
    const result = generateWarningText(prediction, { name: 'Guardian' });
    assert.ok(result.includes('readies'));
  });

  test('returns focus for low severity', () => {
    const prediction = {
      ability: { name: 'Shield' },
      severity: TELEGRAPH_SEVERITY.LOW,
    };
    const result = generateWarningText(prediction, { name: 'Boss' });
    assert.ok(result.includes('focuses'));
  });
});

// ============ GENERATE TACTICAL HINT TESTS ============

describe('generateTacticalHint', () => {
  test('returns default for null prediction', () => {
    const result = generateTacticalHint(null);
    assert.strictEqual(result, 'Stay alert!');
  });

  test('suggests fire resistance for burn effect', () => {
    const prediction = { ability: { effect: { type: 'burn' } } };
    const result = generateTacticalHint(prediction);
    assert.ok(result.includes('fire resistance'));
  });

  test('suggests antidotes for poison effect', () => {
    const prediction = { ability: { effect: { type: 'poison' } } };
    const result = generateTacticalHint(prediction);
    assert.ok(result.includes('antidotes'));
  });

  test('suggests defend for stun effect', () => {
    const prediction = { ability: { effect: { type: 'stun' } } };
    const result = generateTacticalHint(prediction);
    assert.ok(result.includes('stun'));
  });

  test('suggests attack for buff type', () => {
    const prediction = { type: TELEGRAPH_TYPES.BUFF, ability: {} };
    const result = generateTacticalHint(prediction);
    assert.ok(result.includes('attack'));
  });

  test('suggests damage for heal type', () => {
    const prediction = { type: TELEGRAPH_TYPES.HEAL, ability: {} };
    const result = generateTacticalHint(prediction);
    assert.ok(result.includes('damage'));
  });
});

// ============ GET TELEGRAPH SUMMARY TESTS ============

describe('getTelegraphSummary', () => {
  test('returns complete summary object', () => {
    const boss = {
      name: 'Test Boss',
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
      aiBehavior: 'basic',
    };
    const player = { hp: 100, maxHp: 100, def: 5 };

    const result = getTelegraphSummary(boss, player);

    assert.ok(result.prediction);
    assert.ok(result.warningText);
    assert.ok(result.tacticalHint);
    assert.ok(typeof result.confidencePercent === 'number');
    assert.ok(result.severityClass);
    assert.ok(result.typeIcon);
  });
});

// ============ UI RENDERING TESTS ============

describe('renderTelegraphPanel', () => {
  test('returns empty string for non-boss', () => {
    const result = renderTelegraphPanel({ isBoss: false }, {});
    assert.strictEqual(result, '');
  });

  test('returns HTML for boss', () => {
    const boss = {
      name: 'Test Boss',
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
    };
    const player = { hp: 100, maxHp: 100, def: 5 };

    const result = renderTelegraphPanel(boss, player);
    assert.ok(result.includes('telegraph-panel'));
    assert.ok(result.includes('Boss Action Preview'));
  });
});

describe('renderTelegraphIndicator', () => {
  test('returns empty for non-boss', () => {
    const result = renderTelegraphIndicator(null, {});
    assert.strictEqual(result, '');
  });

  test('returns HTML for boss', () => {
    const boss = {
      name: 'Test Boss',
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
    };
    const result = renderTelegraphIndicator(boss, {});
    assert.ok(result.includes('telegraph-indicator'));
  });
});

describe('renderTelegraphTooltip', () => {
  test('returns unknown for null prediction', () => {
    const result = renderTelegraphTooltip(null);
    assert.ok(result.includes('Unknown'));
  });

  test('returns tooltip with ability details', () => {
    const prediction = {
      ability: {
        name: 'Fire Breath',
        type: 'magical',
        power: 30,
        element: 'fire',
        effect: { type: 'burn' },
      },
      confidence: 0.7,
    };
    const result = renderTelegraphTooltip(prediction);
    assert.ok(result.includes('Fire Breath'));
    assert.ok(result.includes('Power: 30'));
    assert.ok(result.includes('fire'));
  });
});

describe('renderBossCombatTelegraph', () => {
  test('returns null for non-boss', () => {
    const result = renderBossCombatTelegraph(null, {});
    assert.strictEqual(result, null);
  });

  test('returns log entry for boss', () => {
    const boss = {
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
    };
    const result = renderBossCombatTelegraph(boss, {});
    assert.ok(result);
    assert.strictEqual(result.type, 'telegraph');
    assert.ok(result.message);
    assert.ok(result.timestamp);
  });
});

describe('getBossTelegraph', () => {
  test('returns null for non-boss', () => {
    const result = getBossTelegraph({ isBoss: false }, {});
    assert.strictEqual(result, null);
  });

  test('returns summary for boss', () => {
    const boss = {
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
    };
    const result = getBossTelegraph(boss, {});
    assert.ok(result);
    assert.ok(result.prediction);
  });
});

describe('getTelegraphSummaryLine', () => {
  test('returns empty for non-boss', () => {
    const result = getTelegraphSummaryLine(null, {});
    assert.strictEqual(result, '');
  });

  test('returns summary line for boss', () => {
    const boss = {
      isBoss: true,
      abilities: ['vine-whip'],
      mp: 100,
      atk: 10,
      name: 'Test Boss',
    };
    const result = getTelegraphSummaryLine(boss, {});
    assert.ok(result.length > 0);
  });
});

describe('getTelegraphStyles', () => {
  test('returns CSS string', () => {
    const result = getTelegraphStyles();
    assert.ok(result.includes('.telegraph-panel'));
    assert.ok(result.includes('.telegraph-critical'));
  });
});

// ============ SECURITY TESTS ============

describe('Security - No forbidden words', () => {
  const forbiddenWords = ['egg', 'easter', 'yolk', 'bunny', 'rabbit', 'phoenix'];

  test('boss-telegraph.js has no forbidden words', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('./src/boss-telegraph.js', 'utf8').toLowerCase();
    for (const word of forbiddenWords) {
      assert.ok(!content.includes(word), `Found forbidden word: ${word}`);
    }
  });

  test('boss-telegraph-ui.js has no forbidden words', async () => {
    const fs = await import('node:fs');
    const content = fs.readFileSync('./src/boss-telegraph-ui.js', 'utf8').toLowerCase();
    for (const word of forbiddenWords) {
      assert.ok(!content.includes(word), `Found forbidden word: ${word}`);
    }
  });
});
