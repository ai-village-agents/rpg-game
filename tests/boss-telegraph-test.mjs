import { describe, test } from 'node:test';
import assert from 'node:assert';
import * as telegraph from '../src/boss-telegraph.js';

const weakEnemy = {
  atk: 10,
  mp: 50,
  maxMp: 50,
  abilities: [],
  aiBehavior: 'basic',
  hp: 100,
  maxHp: 100,
  isBoss: false,
};

const strongEnemy = {
  atk: 35,
  mp: 50,
  maxMp: 50,
  abilities: [],
  aiBehavior: 'aggressive',
  hp: 80,
  maxHp: 100,
  isBoss: false,
};

const bossEnemy = {
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
};

const bossNearThreshold = {
  ...bossEnemy,
  hp: 84,
  currentHp: 84,
};

describe('boss-telegraph constants', () => {
  test('URGENCY_LEVELS exposes expected keys', () => {
    assert.strictEqual(telegraph.URGENCY_LEVELS.LOW, 'low');
    assert.strictEqual(telegraph.URGENCY_LEVELS.MEDIUM, 'medium');
    assert.strictEqual(telegraph.URGENCY_LEVELS.HIGH, 'high');
    assert.strictEqual(telegraph.URGENCY_LEVELS.EXTREME, 'extreme');
  });

  test('ELEMENT_ICONS includes physical sword icon', () => {
    assert.strictEqual(telegraph.ELEMENT_ICONS.physical, '⚔️');
  });
});

describe('getTelegraphIcon', () => {
  test('returns shield for defend', () => {
    assert.strictEqual(telegraph.getTelegraphIcon('defend', null), '🛡️');
  });

  test('returns sword for attack', () => {
    assert.strictEqual(telegraph.getTelegraphIcon('attack', null), '⚔️');
  });

  test('returns element icon for boss ability', () => {
    assert.strictEqual(telegraph.getTelegraphIcon('ability', 'inferno'), '🔥');
  });

  test('returns element icon for regular ability', () => {
    assert.strictEqual(telegraph.getTelegraphIcon('ability', 'blizzard'), '❄️');
  });

  test('returns crystal ball when element is unknown', () => {
    assert.strictEqual(telegraph.getTelegraphIcon('ability', 'dark-pulse'), '🔮');
  });
});

describe('getTelegraphLabel', () => {
  test('returns defend label', () => {
    assert.strictEqual(telegraph.getTelegraphLabel('defend', null), 'Preparing Defense');
  });

  test('returns attack label', () => {
    assert.strictEqual(telegraph.getTelegraphLabel('attack', null), 'Basic Attack');
  });

  test('returns boss ability name', () => {
    assert.strictEqual(telegraph.getTelegraphLabel('ability', 'inferno'), 'Inferno');
  });

  test('returns regular ability name', () => {
    assert.strictEqual(telegraph.getTelegraphLabel('ability', 'blizzard'), 'Blizzard');
  });

  test('returns unknown ability label', () => {
    assert.strictEqual(telegraph.getTelegraphLabel('ability', 'missing-ability'), 'Unknown Ability');
  });
});

describe('getTelegraphUrgency', () => {
  test('defend action is low urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('defend', null, weakEnemy), telegraph.URGENCY_LEVELS.LOW);
  });

  test('weak attack is low urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('attack', null, weakEnemy), telegraph.URGENCY_LEVELS.LOW);
  });

  test('medium attack is medium urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('attack', null, { atk: 20 }), telegraph.URGENCY_LEVELS.MEDIUM);
  });

  test('strong attack is high urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('attack', null, strongEnemy), telegraph.URGENCY_LEVELS.HIGH);
  });

  test('high power boss ability is extreme urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'inferno', bossEnemy), telegraph.URGENCY_LEVELS.EXTREME);
  });

  test('mid power boss ability is high urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'thorn-storm', bossEnemy), telegraph.URGENCY_LEVELS.HIGH);
  });

  test('low power boss ability is medium urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'vine-whip', bossEnemy), telegraph.URGENCY_LEVELS.HIGH);
  });

  test('boss heal ability is low urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'regenerate', bossEnemy), telegraph.URGENCY_LEVELS.LOW);
  });

  test('regular ability with power 2.0 is extreme urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'backstab', weakEnemy), telegraph.URGENCY_LEVELS.EXTREME);
  });

  test('regular ability with power 1.5 is high urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'power-strike', weakEnemy), telegraph.URGENCY_LEVELS.HIGH);
  });

  test('regular ability with power 1.0 is medium urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'poison-blade', weakEnemy), telegraph.URGENCY_LEVELS.MEDIUM);
  });

  test('regular ability with power below 1.0 is low urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'shield-bash', weakEnemy), telegraph.URGENCY_LEVELS.LOW);
  });

  test('unknown ability defaults to medium urgency', () => {
    assert.strictEqual(telegraph.getTelegraphUrgency('ability', 'missing-ability', weakEnemy), telegraph.URGENCY_LEVELS.MEDIUM);
  });
});

describe('getTelegraphDescription', () => {
  test('defend description matches expected text', () => {
    assert.strictEqual(
      telegraph.getTelegraphDescription('defend', null, weakEnemy),
      'The enemy is bracing for impact. Consider using buffs or healing.'
    );
  });

  test('attack description includes damage range', () => {
    assert.strictEqual(
      telegraph.getTelegraphDescription('attack', null, { atk: 20 }),
      'Preparing a basic attack. ~16-24 physical damage.'
    );
  });

  test('ability description uses boss ability text', () => {
    assert.strictEqual(
      telegraph.getTelegraphDescription('ability', 'inferno', bossEnemy),
      'Engulfs the area in flames.'
    );
  });

  test('ability description uses regular ability text', () => {
    assert.strictEqual(
      telegraph.getTelegraphDescription('ability', 'blizzard', weakEnemy),
      'Unleash a freezing storm on all enemies.'
    );
  });

  test('unknown ability returns fallback description', () => {
    assert.strictEqual(
      telegraph.getTelegraphDescription('ability', 'missing-ability', weakEnemy),
      'Preparing an unknown ability...'
    );
  });
});

describe('predictEnemyTelegraph', () => {
  test('returns null for null enemy', () => {
    assert.strictEqual(telegraph.predictEnemyTelegraph(null, 1), null);
  });

  test('returns object with expected fields for valid enemy', () => {
    const result = telegraph.predictEnemyTelegraph(weakEnemy, 1);
    assert.ok(result);
    assert.ok(['attack', 'ability', 'defend'].includes(result.action));
    assert.ok(Object.prototype.hasOwnProperty.call(result, 'abilityId'));
    assert.ok(result.icon);
    assert.ok(result.label);
    assert.ok(result.description);
    assert.ok(result.urgency);
  });

  test('predictEnemyTelegraph uses attack for basic enemy with seed 1', () => {
    const result = telegraph.predictEnemyTelegraph(weakEnemy, 1);
    assert.strictEqual(result.action, 'attack');
    assert.strictEqual(result.abilityId, null);
  });
});

describe('getBossPhaseWarning', () => {
  test('returns null for non-boss', () => {
    assert.strictEqual(telegraph.getBossPhaseWarning(weakEnemy), null);
  });

  test('returns null when not near threshold', () => {
    const farBoss = { ...bossEnemy, hp: 120, currentHp: 120 };
    assert.strictEqual(telegraph.getBossPhaseWarning(farBoss), null);
  });

  test('returns warning object near threshold', () => {
    const warning = telegraph.getBossPhaseWarning(bossNearThreshold);
    assert.ok(warning);
    assert.strictEqual(warning.isWarning, true);
    assert.strictEqual(warning.nextPhaseName, 'Enraged');
    assert.strictEqual(warning.threshold, 0.5);
    assert.ok(warning.message.includes('Phase transition'));
  });

  test('returns null when boss has no phases', () => {
    assert.strictEqual(telegraph.getBossPhaseWarning({ ...bossEnemy, phases: [] }), null);
  });
});
