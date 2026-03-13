/**
 * Skill Chain System Tests
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  SKILL_ELEMENTS,
  ELEMENT_SYNERGIES,
  ELEMENT_CONFLICTS,
  SKILL_TYPES,
  CHAIN_BONUSES,
  CHAIN_RARITY,
  createSkillChainState,
  createSkill,
  createChain,
  analyzeChain,
  calculateRarity,
  calculateBonuses,
  findSpecialCombos,
  saveChain,
  deleteChain,
  setActiveChain,
  executeChain,
  getChain,
  getSavedChains,
  getMostUsedChains,
  getChainsByRarity,
  renameChain,
  unlockSlot,
  getEffectiveCooldown,
  getEffectiveManaCost,
  getChainStats,
  getRarityBreakdown,
  canChain,
  getChainRecommendations
} from '../src/skill-chain-system.js';

import {
  ELEMENT_ICONS,
  TYPE_ICONS,
  renderSkillChainPanel,
  renderSavedChains,
  renderChainCard,
  renderChainCreator,
  renderChainPreview,
  renderSkillOption,
  renderExecutionResult,
  renderChainStatsPanel,
  renderSynergyGuide,
  renderMiniChainDisplay,
  renderDeleteConfirmation
} from '../src/skill-chain-system-ui.js';

// Helper to create test skills
function createTestSkill(id, name, element, type, mana = 10, cd = 5, damage = 50) {
  return createSkill(id, name, element, type, mana, cd, damage);
}

describe('Skill Elements', () => {
  it('should have all expected elements', () => {
    assert.strictEqual(Object.keys(SKILL_ELEMENTS).length, 10);
    assert.ok(SKILL_ELEMENTS.FIRE);
    assert.ok(SKILL_ELEMENTS.ICE);
    assert.ok(SKILL_ELEMENTS.LIGHTNING);
    assert.ok(SKILL_ELEMENTS.EARTH);
  });

  it('should have synergies for each element', () => {
    for (const element of Object.values(SKILL_ELEMENTS)) {
      assert.ok(Array.isArray(ELEMENT_SYNERGIES[element]));
    }
  });

  it('should have conflicts for each element', () => {
    for (const element of Object.values(SKILL_ELEMENTS)) {
      assert.ok(Array.isArray(ELEMENT_CONFLICTS[element]));
    }
  });
});

describe('Skill Types', () => {
  it('should have all expected types', () => {
    assert.ok(SKILL_TYPES.ATTACK);
    assert.ok(SKILL_TYPES.DEFENSE);
    assert.ok(SKILL_TYPES.BUFF);
    assert.ok(SKILL_TYPES.DEBUFF);
    assert.ok(SKILL_TYPES.HEAL);
    assert.ok(SKILL_TYPES.UTILITY);
  });
});

describe('Chain Bonuses', () => {
  it('should have required bonus types', () => {
    assert.ok(CHAIN_BONUSES.DAMAGE_BOOST);
    assert.ok(CHAIN_BONUSES.MANA_REDUCTION);
    assert.ok(CHAIN_BONUSES.COOLDOWN_REDUCTION);
  });

  it('should have valid bonus values', () => {
    for (const bonus of Object.values(CHAIN_BONUSES)) {
      assert.ok(bonus.perLink > 0);
      assert.ok(bonus.maxBonus > 0);
      assert.ok(bonus.maxBonus >= bonus.perLink);
    }
  });
});

describe('Chain Rarity', () => {
  it('should have all rarities', () => {
    assert.ok(CHAIN_RARITY.COMMON);
    assert.ok(CHAIN_RARITY.UNCOMMON);
    assert.ok(CHAIN_RARITY.RARE);
    assert.ok(CHAIN_RARITY.EPIC);
    assert.ok(CHAIN_RARITY.LEGENDARY);
  });

  it('should have increasing synergy requirements', () => {
    assert.ok(CHAIN_RARITY.COMMON.minSynergy < CHAIN_RARITY.UNCOMMON.minSynergy);
    assert.ok(CHAIN_RARITY.UNCOMMON.minSynergy < CHAIN_RARITY.RARE.minSynergy);
    assert.ok(CHAIN_RARITY.RARE.minSynergy < CHAIN_RARITY.EPIC.minSynergy);
    assert.ok(CHAIN_RARITY.EPIC.minSynergy < CHAIN_RARITY.LEGENDARY.minSynergy);
  });
});

describe('createSkillChainState', () => {
  it('should create empty state', () => {
    const state = createSkillChainState();
    assert.deepStrictEqual(state.savedChains, []);
    assert.strictEqual(state.activeChain, null);
    assert.strictEqual(state.unlockedSlots, 3);
  });

  it('should initialize stats', () => {
    const state = createSkillChainState();
    assert.strictEqual(state.stats.chainsExecuted, 0);
    assert.strictEqual(state.stats.perfectChains, 0);
  });
});

describe('createSkill', () => {
  it('should create skill with all properties', () => {
    const skill = createSkill('fireball', 'Fireball', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 20, 5, 100);
    assert.strictEqual(skill.id, 'fireball');
    assert.strictEqual(skill.name, 'Fireball');
    assert.strictEqual(skill.element, SKILL_ELEMENTS.FIRE);
    assert.strictEqual(skill.type, SKILL_TYPES.ATTACK);
    assert.strictEqual(skill.manaCost, 20);
    assert.strictEqual(skill.cooldown, 5);
    assert.strictEqual(skill.baseDamage, 100);
  });
});

describe('createChain', () => {
  it('should create chain with valid skills', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const result = createChain('Test Chain', skills);
    assert.ok(result.success);
    assert.ok(result.chain);
    assert.strictEqual(result.chain.name, 'Test Chain');
    assert.strictEqual(result.chain.length, 2);
  });

  it('should fail without name', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const result = createChain('', skills);
    assert.strictEqual(result.success, false);
  });

  it('should fail with less than 2 skills', () => {
    const skills = [createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK)];
    const result = createChain('Test', skills);
    assert.strictEqual(result.success, false);
  });

  it('should fail with more than 6 skills', () => {
    const skills = Array(7).fill(null).map((_, i) =>
      createTestSkill(`s${i}`, `Skill ${i}`, SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK)
    );
    const result = createChain('Test', skills);
    assert.strictEqual(result.success, false);
  });

  it('should fail with invalid skill', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      { invalid: true }
    ];
    const result = createChain('Test', skills);
    assert.strictEqual(result.success, false);
  });
});

describe('analyzeChain', () => {
  it('should count synergies', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK) // Fire -> Wind synergy
    ];
    const analysis = analyzeChain(skills);
    assert.strictEqual(analysis.synergyCount, 1);
  });

  it('should count conflicts', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK) // Fire -> Water conflict
    ];
    const analysis = analyzeChain(skills);
    assert.strictEqual(analysis.conflictCount, 1);
  });

  it('should calculate total mana cost', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 20),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 30)
    ];
    const analysis = analyzeChain(skills);
    assert.strictEqual(analysis.totalManaCost, 50);
  });

  it('should mark perfect chains', () => {
    const skills = [
      createTestSkill('s1', 'Skill 1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Skill 2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const analysis = analyzeChain(skills);
    assert.strictEqual(analysis.isPerfect, true);
  });
});

describe('calculateRarity', () => {
  it('should return common for 0 synergies', () => {
    const rarity = calculateRarity(0);
    assert.strictEqual(rarity.name, 'Common');
  });

  it('should return higher rarity for more synergies', () => {
    const uncommon = calculateRarity(2);
    const rare = calculateRarity(4);
    assert.strictEqual(uncommon.name, 'Uncommon');
    assert.strictEqual(rare.name, 'Rare');
  });

  it('should return legendary for max synergies', () => {
    const legendary = calculateRarity(10);
    assert.strictEqual(legendary.name, 'Legendary');
  });
});

describe('findSpecialCombos', () => {
  it('should find elemental mastery', () => {
    const skills = [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s3', 'S3', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK)
    ];
    const combos = findSpecialCombos(skills, { fire: 3 }, {});
    assert.ok(combos.some(c => c.name.includes('Fire')));
  });

  it('should find assault combo', () => {
    const combos = findSpecialCombos([], {}, { attack: 3 });
    assert.ok(combos.some(c => c.name === 'Assault Combo'));
  });

  it('should find elemental storm', () => {
    const combos = findSpecialCombos([], { fire: 1, ice: 1, lightning: 1, earth: 1 }, {});
    assert.ok(combos.some(c => c.name === 'Elemental Storm'));
  });
});

describe('saveChain', () => {
  it('should save chain successfully', () => {
    const state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    const result = saveChain(state, chain);
    assert.ok(result.success);
    assert.strictEqual(result.state.savedChains.length, 1);
  });

  it('should fail with duplicate name', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const { chain: chain2 } = createChain('Test', [
      createTestSkill('s3', 'S3', SKILL_ELEMENTS.ICE, SKILL_TYPES.ATTACK),
      createTestSkill('s4', 'S4', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK)
    ]);
    const result = saveChain(state, chain2);
    assert.strictEqual(result.success, false);
  });

  it('should fail at max chains', () => {
    let state = createSkillChainState();
    state.maxSavedChains = 2;

    for (let i = 0; i < 2; i++) {
      const { chain } = createChain(`Chain${i}`, [
        createTestSkill(`s${i}a`, 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
        createTestSkill(`s${i}b`, 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
      ]);
      state = saveChain(state, chain).state;
    }

    const { chain } = createChain('Extra', [
      createTestSkill('sx', 'SX', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('sy', 'SY', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    const result = saveChain(state, chain);
    assert.strictEqual(result.success, false);
  });
});

describe('deleteChain', () => {
  it('should delete chain', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const result = deleteChain(state, chain.id);
    assert.ok(result.success);
    assert.strictEqual(result.state.savedChains.length, 0);
  });

  it('should fail for non-existent chain', () => {
    const state = createSkillChainState();
    const result = deleteChain(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });

  it('should clear active chain if deleted', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;
    state = setActiveChain(state, chain.id).state;

    const result = deleteChain(state, chain.id);
    assert.strictEqual(result.state.activeChain, null);
  });
});

describe('setActiveChain', () => {
  it('should set active chain', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const result = setActiveChain(state, chain.id);
    assert.ok(result.success);
    assert.strictEqual(result.state.activeChain.id, chain.id);
  });

  it('should fail for non-existent chain', () => {
    const state = createSkillChainState();
    const result = setActiveChain(state, 'nonexistent');
    assert.strictEqual(result.success, false);
  });
});

describe('executeChain', () => {
  it('should execute chain successfully', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 10, 5, 50),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 10, 5, 50)
    ]);
    state = saveChain(state, chain).state;

    const result = executeChain(state, chain.id, 100);
    assert.ok(result.success);
    assert.ok(result.execution);
    assert.ok(result.execution.damage > 0);
  });

  it('should fail with insufficient mana', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 50, 5, 50),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 50, 5, 50)
    ]);
    state = saveChain(state, chain).state;

    const result = executeChain(state, chain.id, 10);
    assert.strictEqual(result.success, false);
    assert.ok(result.error.includes('mana'));
  });

  it('should update stats', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 10, 5, 50),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 10, 5, 50)
    ]);
    state = saveChain(state, chain).state;

    const result = executeChain(state, chain.id, 100);
    assert.strictEqual(result.state.stats.chainsExecuted, 1);
  });

  it('should increment chain usage', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 10, 5, 50),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 10, 5, 50)
    ]);
    state = saveChain(state, chain).state;

    const result = executeChain(state, chain.id, 100);
    const updatedChain = result.state.savedChains.find(c => c.id === chain.id);
    assert.strictEqual(updatedChain.timesUsed, 1);
  });
});

describe('getChain', () => {
  it('should get chain by id', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const found = getChain(state, chain.id);
    assert.ok(found);
    assert.strictEqual(found.name, 'Test');
  });

  it('should return null for non-existent', () => {
    const state = createSkillChainState();
    assert.strictEqual(getChain(state, 'nonexistent'), null);
  });
});

describe('getMostUsedChains', () => {
  it('should return sorted by usage', () => {
    let state = createSkillChainState();

    const { chain: c1 } = createChain('Chain1', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK, 5),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK, 5)
    ]);
    const { chain: c2 } = createChain('Chain2', [
      createTestSkill('s3', 'S3', SKILL_ELEMENTS.ICE, SKILL_TYPES.ATTACK, 5),
      createTestSkill('s4', 'S4', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK, 5)
    ]);

    state = saveChain(state, c1).state;
    state = saveChain(state, c2).state;

    // Use c2 more
    state = executeChain(state, c2.id, 100).state;
    state = executeChain(state, c2.id, 100).state;
    state = executeChain(state, c1.id, 100).state;

    const mostUsed = getMostUsedChains(state, 2);
    assert.strictEqual(mostUsed[0].name, 'Chain2');
  });
});

describe('renameChain', () => {
  it('should rename chain', () => {
    let state = createSkillChainState();
    const { chain } = createChain('OldName', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const result = renameChain(state, chain.id, 'NewName');
    assert.ok(result.success);
    assert.strictEqual(result.state.savedChains[0].name, 'NewName');
  });

  it('should fail with duplicate name', () => {
    let state = createSkillChainState();
    const { chain: c1 } = createChain('Chain1', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    const { chain: c2 } = createChain('Chain2', [
      createTestSkill('s3', 'S3', SKILL_ELEMENTS.ICE, SKILL_TYPES.ATTACK),
      createTestSkill('s4', 'S4', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, c1).state;
    state = saveChain(state, c2).state;

    const result = renameChain(state, c1.id, 'Chain2');
    assert.strictEqual(result.success, false);
  });
});

describe('unlockSlot', () => {
  it('should unlock slot', () => {
    const state = createSkillChainState();
    const result = unlockSlot(state);
    assert.ok(result.success);
    assert.strictEqual(result.state.unlockedSlots, 4);
  });

  it('should fail at max slots', () => {
    let state = createSkillChainState();
    state.unlockedSlots = 6;
    const result = unlockSlot(state);
    assert.strictEqual(result.success, false);
  });
});

describe('getEffectiveCooldown', () => {
  it('should apply reduction', () => {
    const chain = {
      totalCooldown: 10,
      bonuses: { COOLDOWN_REDUCTION: 0.2 }
    };
    assert.strictEqual(getEffectiveCooldown(chain), 8);
  });
});

describe('getEffectiveManaCost', () => {
  it('should apply reduction', () => {
    const chain = {
      totalManaCost: 100,
      bonuses: { MANA_REDUCTION: 0.1 }
    };
    assert.strictEqual(getEffectiveManaCost(chain), 90);
  });
});

describe('canChain', () => {
  it('should detect synergy', () => {
    const s1 = createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK);
    const s2 = createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK);
    const result = canChain(s1, s2);
    assert.strictEqual(result.hasSynergy, true);
    assert.strictEqual(result.recommendation, 'excellent');
  });

  it('should detect conflict', () => {
    const s1 = createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK);
    const s2 = createTestSkill('s2', 'S2', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK);
    const result = canChain(s1, s2);
    assert.strictEqual(result.hasConflict, true);
    assert.strictEqual(result.recommendation, 'poor');
  });
});

describe('getChainRecommendations', () => {
  it('should prioritize synergies', () => {
    const current = [createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK)];
    const available = [
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK), // synergy
      createTestSkill('s3', 'S3', SKILL_ELEMENTS.WATER, SKILL_TYPES.ATTACK), // conflict
      createTestSkill('s4', 'S4', SKILL_ELEMENTS.ARCANE, SKILL_TYPES.ATTACK) // neutral
    ];

    const recommendations = getChainRecommendations(current, available);
    assert.strictEqual(recommendations[0].recommendation, 'synergy');
  });

  it('should return all skills when no current', () => {
    const available = [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.ICE, SKILL_TYPES.ATTACK)
    ];
    const recommendations = getChainRecommendations([], available);
    assert.strictEqual(recommendations.length, 2);
  });
});

// UI Tests

describe('ELEMENT_ICONS', () => {
  it('should have icons for all elements', () => {
    for (const element of Object.values(SKILL_ELEMENTS)) {
      assert.ok(ELEMENT_ICONS[element], `Missing icon for ${element}`);
    }
  });
});

describe('TYPE_ICONS', () => {
  it('should have icons for all types', () => {
    for (const type of Object.values(SKILL_TYPES)) {
      assert.ok(TYPE_ICONS[type], `Missing icon for ${type}`);
    }
  });
});

describe('renderSkillChainPanel', () => {
  it('should render panel', () => {
    const state = createSkillChainState();
    const html = renderSkillChainPanel(state);
    assert.ok(html.includes('skill-chain-panel'));
    assert.ok(html.includes('Skill Chains'));
  });

  it('should show active chain bar when set', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;
    state = setActiveChain(state, chain.id).state;

    const html = renderSkillChainPanel(state);
    assert.ok(html.includes('active-chain-bar'));
    assert.ok(html.includes('Test'));
  });
});

describe('renderSavedChains', () => {
  it('should show empty message', () => {
    const state = createSkillChainState();
    const html = renderSavedChains(state);
    assert.ok(html.includes('No saved chains'));
  });

  it('should render chain cards', () => {
    let state = createSkillChainState();
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    state = saveChain(state, chain).state;

    const html = renderSavedChains(state);
    assert.ok(html.includes('chain-card'));
  });
});

describe('renderChainCard', () => {
  it('should render chain details', () => {
    const { chain } = createChain('Test Chain', [
      createTestSkill('s1', 'Fireball', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'Gust', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);

    const html = renderChainCard(chain, false);
    assert.ok(html.includes('chain-card'));
    assert.ok(html.includes('Test Chain'));
    assert.ok(html.includes('Fireball'));
    assert.ok(html.includes('Gust'));
  });

  it('should mark active chain', () => {
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);

    const html = renderChainCard(chain, true);
    assert.ok(html.includes('active'));
    assert.ok(html.includes('Active'));
  });
});

describe('renderChainCreator', () => {
  it('should render creator', () => {
    const html = renderChainCreator([], []);
    assert.ok(html.includes('chain-creator'));
    assert.ok(html.includes('Create New Chain'));
  });

  it('should show skill slots', () => {
    const html = renderChainCreator([], []);
    assert.ok(html.includes('skill-slot'));
  });

  it('should show preview when skills selected', () => {
    const skills = [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const html = renderChainCreator([], skills);
    assert.ok(html.includes('chain-preview'));
  });
});

describe('renderChainPreview', () => {
  it('should render analysis', () => {
    const skills = [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const analysis = analyzeChain(skills);
    const html = renderChainPreview(analysis);

    assert.ok(html.includes('chain-preview'));
    assert.ok(html.includes('Synergies'));
  });

  it('should show perfect badge', () => {
    const skills = [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ];
    const analysis = analyzeChain(skills);
    const html = renderChainPreview(analysis);

    assert.ok(html.includes('Perfect Chain'));
  });
});

describe('renderExecutionResult', () => {
  it('should render execution', () => {
    const execution = {
      chainName: 'Test',
      damage: 150,
      manaCost: 20,
      wasPerfect: true,
      skills: ['Fireball', 'Gust'],
      specialCombos: []
    };

    const html = renderExecutionResult(execution);
    assert.ok(html.includes('Chain Executed'));
    assert.ok(html.includes('150'));
    assert.ok(html.includes('Perfect'));
  });
});

describe('renderChainStatsPanel', () => {
  it('should render stats', () => {
    const state = createSkillChainState();
    const html = renderChainStatsPanel(state);
    assert.ok(html.includes('Chain Statistics'));
    assert.ok(html.includes('Chains Executed'));
  });
});

describe('renderSynergyGuide', () => {
  it('should render guide', () => {
    const html = renderSynergyGuide();
    assert.ok(html.includes('Element Synergies'));
    assert.ok(html.includes('Tips'));
  });
});

describe('renderMiniChainDisplay', () => {
  it('should show empty state', () => {
    const html = renderMiniChainDisplay(null);
    assert.ok(html.includes('No active chain'));
  });

  it('should show active chain', () => {
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    const html = renderMiniChainDisplay(chain);
    assert.ok(html.includes('Test'));
    assert.ok(html.includes('🔥'));
  });
});

describe('renderDeleteConfirmation', () => {
  it('should render confirmation', () => {
    const { chain } = createChain('Test', [
      createTestSkill('s1', 'S1', SKILL_ELEMENTS.FIRE, SKILL_TYPES.ATTACK),
      createTestSkill('s2', 'S2', SKILL_ELEMENTS.WIND, SKILL_TYPES.ATTACK)
    ]);
    const html = renderDeleteConfirmation(chain);
    assert.ok(html.includes('Delete Chain'));
    assert.ok(html.includes('Test'));
    assert.ok(html.includes('confirm-delete-btn'));
  });
});
