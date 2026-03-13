/**
 * Resource Gathering System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  GATHERING_SKILL,
  RESOURCE_RARITY,
  RESOURCE_NODES,
  GATHERING_TOOLS,
  initGatheringState,
  getGatheringState,
  getExpForLevel,
  getSkillProgress,
  addGatheringExp,
  equipTool,
  unequipTool,
  getEquippedTool,
  canGatherNode,
  startGathering,
  cancelGathering,
  completeGathering,
  getGatheringProgress,
  createNodeInstance,
  depleteNodeInstance,
  respawnNodes,
  getNodesAtLocation,
  getGatheringStats,
  getAvailableNodes,
  getNodesForSkill,
  getSkillLevelBonus,
  getDailyBonusStatus,
  useDailyBonus
} from '../src/resource-gathering-system.js';

import {
  renderGatheringSkillPanel,
  renderGatheringProgress,
  renderNodeSelectionPanel,
  renderToolSelectionPanel,
  renderGatheringResult,
  renderGatheringStats,
  renderGatheringLog,
  renderNodeTooltip,
  renderToolTooltip,
  renderGatheringMapOverlay,
  getGatheringStyles
} from '../src/resource-gathering-system-ui.js';

describe('Resource Gathering System', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero' },
      gathering: initGatheringState()
    };
  });

  describe('Constants and Definitions', () => {
    it('has gathering skills defined', () => {
      assert.ok(GATHERING_SKILL.MINING);
      assert.ok(GATHERING_SKILL.FORAGING);
      assert.ok(GATHERING_SKILL.WOODCUTTING);
      assert.ok(GATHERING_SKILL.SKINNING);
    });

    it('has resource rarities defined', () => {
      assert.ok(RESOURCE_RARITY.COMMON);
      assert.ok(RESOURCE_RARITY.UNCOMMON);
      assert.ok(RESOURCE_RARITY.RARE);
      assert.ok(RESOURCE_RARITY.EPIC);
      assert.ok(RESOURCE_RARITY.LEGENDARY);
    });

    it('has resource nodes with required properties', () => {
      for (const [id, node] of Object.entries(RESOURCE_NODES)) {
        assert.strictEqual(node.id, id, `Node ${id} has matching id`);
        assert.ok(node.name, `Node ${id} has name`);
        assert.ok(node.skill, `Node ${id} has skill`);
        assert.ok(typeof node.requiredLevel === 'number', `Node ${id} has requiredLevel`);
        assert.ok(typeof node.baseExp === 'number', `Node ${id} has baseExp`);
        assert.ok(typeof node.gatherTime === 'number', `Node ${id} has gatherTime`);
        assert.ok(Array.isArray(node.resources), `Node ${id} has resources array`);
        assert.ok(typeof node.depleteChance === 'number', `Node ${id} has depleteChance`);
      }
    });

    it('has gathering tools with required properties', () => {
      for (const [id, tool] of Object.entries(GATHERING_TOOLS)) {
        assert.strictEqual(tool.id, id, `Tool ${id} has matching id`);
        assert.ok(tool.name, `Tool ${id} has name`);
        assert.ok(tool.skill, `Tool ${id} has skill`);
        assert.ok(typeof tool.speedBonus === 'number', `Tool ${id} has speedBonus`);
        assert.ok(typeof tool.yieldBonus === 'number', `Tool ${id} has yieldBonus`);
        assert.ok(typeof tool.rareChanceBonus === 'number', `Tool ${id} has rareChanceBonus`);
      }
    });

    it('has mining nodes', () => {
      const miningNodes = getNodesForSkill('mining');
      assert.ok(miningNodes.length > 0);
    });

    it('has foraging nodes', () => {
      const foragingNodes = getNodesForSkill('foraging');
      assert.ok(foragingNodes.length > 0);
    });

    it('has woodcutting nodes', () => {
      const woodcuttingNodes = getNodesForSkill('woodcutting');
      assert.ok(woodcuttingNodes.length > 0);
    });

    it('has skinning nodes', () => {
      const skinningNodes = getNodesForSkill('skinning');
      assert.ok(skinningNodes.length > 0);
    });
  });

  describe('State Initialization', () => {
    it('initializes empty gathering state', () => {
      const gatheringState = initGatheringState();
      assert.ok(gatheringState.skills);
      assert.ok(gatheringState.equippedTools);
      assert.strictEqual(gatheringState.activeGathering, null);
      assert.deepStrictEqual(gatheringState.nodeInstances, {});
      assert.deepStrictEqual(gatheringState.gatheringLog, []);
      assert.deepStrictEqual(gatheringState.totalGathered, {});
    });

    it('initializes skills at level 1', () => {
      const gatheringState = initGatheringState();
      assert.strictEqual(gatheringState.skills.mining.level, 1);
      assert.strictEqual(gatheringState.skills.foraging.level, 1);
      assert.strictEqual(gatheringState.skills.woodcutting.level, 1);
      assert.strictEqual(gatheringState.skills.skinning.level, 1);
    });

    it('gets gathering state from game state', () => {
      const gatheringState = getGatheringState(state);
      assert.ok(gatheringState);
      assert.ok(gatheringState.skills);
    });

    it('returns default state if gathering not present', () => {
      const gatheringState = getGatheringState({});
      assert.ok(gatheringState);
      assert.ok(gatheringState.skills);
    });
  });

  describe('Experience System', () => {
    it('calculates exp for level', () => {
      const exp1 = getExpForLevel(1);
      const exp5 = getExpForLevel(5);
      assert.ok(exp1 > 0);
      assert.ok(exp5 > exp1);
    });

    it('gets skill progress', () => {
      const progress = getSkillProgress(state, 'mining');
      assert.strictEqual(progress.level, 1);
      assert.strictEqual(progress.exp, 0);
      assert.ok(progress.expToNext > 0);
      assert.strictEqual(progress.progress, 0);
    });

    it('adds gathering exp', () => {
      const result = addGatheringExp(state, 'mining', 50);
      const progress = getSkillProgress(result.state, 'mining');
      assert.strictEqual(progress.exp, 50);
    });

    it('levels up when exp threshold reached', () => {
      const expToLevel = getExpForLevel(1);
      const result = addGatheringExp(state, 'mining', expToLevel + 10);
      assert.ok(result.leveledUp);
      assert.strictEqual(result.newLevel, 2);
    });

    it('handles multiple level ups', () => {
      const result = addGatheringExp(state, 'mining', 10000);
      assert.ok(result.leveledUp);
      assert.ok(result.newLevel > 2);
    });

    it('returns default progress for invalid skill', () => {
      const progress = getSkillProgress(state, 'invalid');
      assert.strictEqual(progress.level, 1);
    });
  });

  describe('Tool Management', () => {
    it('equips a tool', () => {
      const result = equipTool(state, 'basic_pickaxe');
      assert.ok(result.equipped);
      assert.strictEqual(result.tool.id, 'basic_pickaxe');
    });

    it('updates equipped tools state', () => {
      const result = equipTool(state, 'basic_pickaxe');
      assert.strictEqual(result.state.gathering.equippedTools.mining, 'basic_pickaxe');
    });

    it('fails to equip invalid tool', () => {
      const result = equipTool(state, 'nonexistent');
      assert.ok(!result.equipped);
      assert.strictEqual(result.error, 'Invalid tool');
    });

    it('unequips a tool', () => {
      let result = equipTool(state, 'basic_pickaxe');
      result = unequipTool(result.state, 'mining');
      assert.ok(result.unequipped);
      assert.strictEqual(result.state.gathering.equippedTools.mining, null);
    });

    it('gets equipped tool', () => {
      const result = equipTool(state, 'basic_pickaxe');
      const tool = getEquippedTool(result.state, 'mining');
      assert.ok(tool);
      assert.strictEqual(tool.id, 'basic_pickaxe');
    });

    it('returns null for no equipped tool', () => {
      const tool = getEquippedTool(state, 'mining');
      assert.strictEqual(tool, null);
    });
  });

  describe('Gathering Checks', () => {
    it('can gather from level 1 node', () => {
      const result = canGatherNode(state, 'copper_vein');
      assert.ok(result.canGather);
    });

    it('cannot gather from high level node', () => {
      const result = canGatherNode(state, 'mythril_vein');
      assert.ok(!result.canGather);
      assert.ok(result.error.includes('Requires'));
    });

    it('fails for invalid node', () => {
      const result = canGatherNode(state, 'nonexistent');
      assert.ok(!result.canGather);
      assert.strictEqual(result.error, 'Invalid node');
    });

    it('cannot gather while already gathering', () => {
      const startResult = startGathering(state, 'copper_vein');
      const result = canGatherNode(startResult.state, 'copper_vein');
      assert.ok(!result.canGather);
      assert.strictEqual(result.error, 'Already gathering');
    });
  });

  describe('Gathering Process', () => {
    it('starts gathering', () => {
      const result = startGathering(state, 'copper_vein');
      assert.ok(result.started);
      assert.ok(result.gatherTime > 0);
      assert.ok(result.endTime > Date.now());
    });

    it('fails to start gathering for high level node', () => {
      const result = startGathering(state, 'mythril_vein');
      assert.ok(!result.started);
    });

    it('cancels gathering', () => {
      const startResult = startGathering(state, 'copper_vein');
      const cancelResult = cancelGathering(startResult.state);
      assert.ok(cancelResult.cancelled);
      assert.strictEqual(cancelResult.state.gathering.activeGathering, null);
    });

    it('fails to cancel when not gathering', () => {
      const result = cancelGathering(state);
      assert.ok(!result.cancelled);
      assert.strictEqual(result.error, 'Not gathering');
    });

    it('gets gathering progress', () => {
      const startResult = startGathering(state, 'copper_vein');
      const progress = getGatheringProgress(startResult.state);
      assert.ok(progress.isGathering);
      assert.strictEqual(progress.nodeId, 'copper_vein');
      assert.ok(progress.progress >= 0);
    });

    it('returns not gathering when idle', () => {
      const progress = getGatheringProgress(state);
      assert.ok(!progress.isGathering);
    });

    it('completes gathering with resources', () => {
      let result = startGathering(state, 'copper_vein');
      // Force end time to be in the past
      result.state.gathering.activeGathering.endTime = Date.now() - 1000;
      // Use fixed random for predictable results
      const fixedRandom = () => 0.1; // Always succeed
      const completeResult = completeGathering(result.state, fixedRandom);
      assert.ok(completeResult.completed);
      assert.ok(Array.isArray(completeResult.gathered));
      assert.ok(completeResult.exp > 0);
    });

    it('fails to complete when not finished', () => {
      const startResult = startGathering(state, 'copper_vein');
      // End time is in the future
      const completeResult = completeGathering(startResult.state);
      assert.ok(!completeResult.completed);
      assert.strictEqual(completeResult.error, 'Gathering not finished');
    });

    it('fails to complete when not gathering', () => {
      const result = completeGathering(state);
      assert.ok(!result.completed);
      assert.strictEqual(result.error, 'Not gathering');
    });

    it('tool speed bonus reduces gather time', () => {
      const resultNoTool = startGathering(state, 'copper_vein');
      let toolState = equipTool(state, 'steel_pickaxe').state;
      const resultWithTool = startGathering(toolState, 'copper_vein');
      assert.ok(resultWithTool.gatherTime < resultNoTool.gatherTime);
    });
  });

  describe('Node Instances', () => {
    it('creates a node instance', () => {
      const result = createNodeInstance(state, 'copper_vein', 'forest');
      assert.ok(result.created);
      assert.ok(result.instanceId);
    });

    it('fails to create instance for invalid node', () => {
      const result = createNodeInstance(state, 'nonexistent', 'forest');
      assert.ok(!result.created);
      assert.strictEqual(result.error, 'Invalid node');
    });

    it('depletes a node instance', () => {
      const createResult = createNodeInstance(state, 'copper_vein', 'forest');
      const depleteResult = depleteNodeInstance(createResult.state, createResult.instanceId);
      assert.ok(depleteResult.depleted);
      const instance = depleteResult.state.gathering.nodeInstances[createResult.instanceId];
      assert.ok(instance.depleted);
      assert.ok(instance.respawnAt > Date.now());
    });

    it('fails to deplete invalid instance', () => {
      const result = depleteNodeInstance(state, 'nonexistent');
      assert.ok(!result.depleted);
      assert.strictEqual(result.error, 'Invalid instance');
    });

    it('respawns depleted nodes', () => {
      let createResult = createNodeInstance(state, 'copper_vein', 'forest');
      let depleteResult = depleteNodeInstance(createResult.state, createResult.instanceId, 1);
      // Wait briefly
      depleteResult.state.gathering.nodeInstances[createResult.instanceId].respawnAt = Date.now() - 1000;
      const respawnResult = respawnNodes(depleteResult.state);
      assert.ok(respawnResult.respawned.length > 0);
      const instance = respawnResult.state.gathering.nodeInstances[createResult.instanceId];
      assert.ok(!instance.depleted);
    });

    it('gets nodes at location', () => {
      let currentState = state;
      currentState = createNodeInstance(currentState, 'copper_vein', 'forest').state;
      currentState = createNodeInstance(currentState, 'herb_patch', 'forest').state;
      currentState = createNodeInstance(currentState, 'copper_vein', 'cave').state;
      const forestNodes = getNodesAtLocation(currentState, 'forest');
      assert.strictEqual(forestNodes.length, 2);
    });
  });

  describe('Statistics', () => {
    it('gets gathering stats', () => {
      const stats = getGatheringStats(state);
      assert.ok(stats.skills);
      assert.ok(stats.totalGathered !== undefined);
      assert.strictEqual(stats.totalUniqueResources, 0);
      assert.ok(Array.isArray(stats.recentGathers));
    });

    it('tracks total gathered resources', () => {
      let result = startGathering(state, 'copper_vein');
      result.state.gathering.activeGathering.endTime = Date.now() - 1000;
      const fixedRandom = () => 0.1;
      result = completeGathering(result.state, fixedRandom);
      const stats = getGatheringStats(result.state);
      assert.ok(stats.totalUniqueResources >= 0);
    });
  });

  describe('Node Queries', () => {
    it('gets available nodes for skill level', () => {
      const nodes = getAvailableNodes('mining', 1);
      assert.ok(nodes.length > 0);
      assert.ok(nodes.every(n => n.requiredLevel <= 1));
    });

    it('gets more nodes at higher level', () => {
      const nodesLv1 = getAvailableNodes('mining', 1);
      const nodesLv50 = getAvailableNodes('mining', 50);
      assert.ok(nodesLv50.length >= nodesLv1.length);
    });

    it('gets all nodes for skill', () => {
      const nodes = getNodesForSkill('mining');
      assert.ok(nodes.length > 0);
      assert.ok(nodes.every(n => n.skill.id === 'mining'));
    });

    it('sorts nodes by required level', () => {
      const nodes = getNodesForSkill('mining');
      for (let i = 1; i < nodes.length; i++) {
        assert.ok(nodes[i].requiredLevel >= nodes[i - 1].requiredLevel);
      }
    });
  });

  describe('Skill Level Bonuses', () => {
    it('calculates skill level bonuses', () => {
      const bonus = getSkillLevelBonus(10);
      assert.ok(bonus.speedBonus >= 0);
      assert.ok(bonus.yieldBonus >= 0);
      assert.ok(bonus.rareBonus >= 0);
    });

    it('higher levels give better bonuses', () => {
      const bonusLv1 = getSkillLevelBonus(1);
      const bonusLv50 = getSkillLevelBonus(50);
      assert.ok(bonusLv50.speedBonus >= bonusLv1.speedBonus);
      assert.ok(bonusLv50.yieldBonus >= bonusLv1.yieldBonus);
    });

    it('caps bonuses at maximum', () => {
      const bonus = getSkillLevelBonus(100);
      assert.ok(bonus.speedBonus <= 0.5);
      assert.ok(bonus.yieldBonus <= 0.5);
      assert.ok(bonus.rareBonus <= 0.1);
    });
  });

  describe('Daily Bonus', () => {
    it('daily bonus is available initially', () => {
      const status = getDailyBonusStatus(state);
      assert.ok(status.available);
      assert.ok(!status.used);
    });

    it('uses daily bonus', () => {
      const result = useDailyBonus(state);
      assert.ok(result.used);
      assert.strictEqual(result.bonusMultiplier, 2);
    });

    it('cannot use daily bonus twice', () => {
      let result = useDailyBonus(state);
      result = useDailyBonus(result.state);
      assert.ok(!result.used);
      assert.strictEqual(result.error, 'Daily bonus already used');
    });

    it('tracks daily bonus date', () => {
      const result = useDailyBonus(state);
      assert.strictEqual(result.state.gathering.dailyBonus.date, new Date().toDateString());
    });
  });
});

describe('Resource Gathering System UI', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero' },
      gathering: initGatheringState()
    };
  });

  describe('Skill Panel Rendering', () => {
    it('renders gathering skill panel', () => {
      const html = renderGatheringSkillPanel(state);
      assert.ok(html.includes('gathering-skill-panel'));
      assert.ok(html.includes('Gathering Skills'));
    });

    it('shows all four skills', () => {
      const html = renderGatheringSkillPanel(state);
      assert.ok(html.includes('Mining'));
      assert.ok(html.includes('Foraging'));
      assert.ok(html.includes('Woodcutting'));
      assert.ok(html.includes('Skinning'));
    });

    it('shows skill levels', () => {
      const html = renderGatheringSkillPanel(state);
      assert.ok(html.includes('Lv. 1'));
    });

    it('marks selected skill', () => {
      const html = renderGatheringSkillPanel(state, { selectedSkill: 'mining' });
      assert.ok(html.includes('selected'));
    });
  });

  describe('Progress Rendering', () => {
    it('shows inactive when not gathering', () => {
      const html = renderGatheringProgress(state);
      assert.ok(html.includes('inactive'));
      assert.ok(html.includes('Not gathering'));
    });

    it('shows progress when gathering', () => {
      const startResult = startGathering(state, 'copper_vein');
      const html = renderGatheringProgress(startResult.state);
      assert.ok(html.includes('active'));
      assert.ok(html.includes('Copper Vein'));
    });

    it('shows cancel button during gathering', () => {
      const startResult = startGathering(state, 'copper_vein');
      const html = renderGatheringProgress(startResult.state);
      assert.ok(html.includes('cancel-btn'));
    });

    it('shows collect button when complete', () => {
      const startResult = startGathering(state, 'copper_vein');
      startResult.state.gathering.activeGathering.endTime = Date.now() - 1000;
      const html = renderGatheringProgress(startResult.state);
      assert.ok(html.includes('collect-btn'));
    });
  });

  describe('Node Selection Rendering', () => {
    it('renders node selection panel', () => {
      const html = renderNodeSelectionPanel(state, 'mining');
      assert.ok(html.includes('node-selection-panel'));
      assert.ok(html.includes('Mining'));
    });

    it('shows nodes for skill', () => {
      const html = renderNodeSelectionPanel(state, 'mining');
      assert.ok(html.includes('Copper Vein'));
    });

    it('marks locked nodes', () => {
      const html = renderNodeSelectionPanel(state, 'mining');
      assert.ok(html.includes('locked') || html.includes('Locked'));
    });
  });

  describe('Tool Selection Rendering', () => {
    it('renders tool selection panel', () => {
      const html = renderToolSelectionPanel(state, 'mining');
      assert.ok(html.includes('tool-selection-panel'));
      assert.ok(html.includes('Mining'));
    });

    it('shows tools for skill', () => {
      const html = renderToolSelectionPanel(state, 'mining');
      assert.ok(html.includes('Basic Pickaxe'));
    });

    it('marks equipped tool', () => {
      const equipResult = equipTool(state, 'basic_pickaxe');
      const html = renderToolSelectionPanel(equipResult.state, 'mining');
      assert.ok(html.includes('equipped'));
    });

    it('shows tool stats', () => {
      const html = renderToolSelectionPanel(state, 'mining');
      assert.ok(html.includes('Speed') || html.includes('Yield') || html.includes('Basic Tool'));
    });
  });

  describe('Result Rendering', () => {
    it('renders gathering result', () => {
      const result = {
        completed: true,
        gathered: [{ id: 'copper_ore', amount: 2 }],
        exp: 10,
        depleted: false,
        leveledUp: false
      };
      const html = renderGatheringResult(result);
      assert.ok(html.includes('gathering-result'));
      assert.ok(html.includes('Gathered!'));
      assert.ok(html.includes('copper ore'));
      assert.ok(html.includes('+10 EXP'));
    });

    it('shows level up notice', () => {
      const result = {
        completed: true,
        gathered: [],
        exp: 10,
        depleted: false,
        leveledUp: true,
        newLevel: 2
      };
      const html = renderGatheringResult(result);
      assert.ok(html.includes('Level Up'));
      assert.ok(html.includes('level 2'));
    });

    it('shows depleted notice', () => {
      const result = {
        completed: true,
        gathered: [],
        exp: 10,
        depleted: true,
        leveledUp: false
      };
      const html = renderGatheringResult(result);
      assert.ok(html.includes('depleted'));
    });

    it('returns empty for incomplete', () => {
      const html = renderGatheringResult({ completed: false });
      assert.strictEqual(html, '');
    });
  });

  describe('Stats Rendering', () => {
    it('renders gathering stats', () => {
      const html = renderGatheringStats(state);
      assert.ok(html.includes('gathering-stats-panel'));
      assert.ok(html.includes('Gathering Statistics'));
    });

    it('shows daily bonus status', () => {
      const html = renderGatheringStats(state);
      assert.ok(html.includes('Daily Bonus'));
    });

    it('shows skill stats', () => {
      const html = renderGatheringStats(state);
      assert.ok(html.includes('Mining'));
      assert.ok(html.includes('Level:'));
    });
  });

  describe('Log Rendering', () => {
    it('renders empty log', () => {
      const html = renderGatheringLog(state);
      assert.ok(html.includes('No recent gathering activity'));
    });

    it('renders log entries', () => {
      // Add a log entry
      state.gathering.gatheringLog = [{
        nodeId: 'copper_vein',
        timestamp: Date.now(),
        gathered: [{ id: 'copper_ore', amount: 2 }],
        exp: 10
      }];
      const html = renderGatheringLog(state);
      assert.ok(html.includes('Copper Vein'));
      assert.ok(html.includes('copper ore'));
    });

    it('limits log entries', () => {
      // Add many entries
      for (let i = 0; i < 20; i++) {
        state.gathering.gatheringLog.push({
          nodeId: 'copper_vein',
          timestamp: Date.now(),
          gathered: [],
          exp: 10
        });
      }
      const html = renderGatheringLog(state, { limit: 5 });
      const matches = html.match(/log-entry/g) || [];
      assert.ok(matches.length <= 5);
    });
  });

  describe('Tooltip Rendering', () => {
    it('renders node tooltip', () => {
      const html = renderNodeTooltip('copper_vein');
      assert.ok(html.includes('node-tooltip'));
      assert.ok(html.includes('Copper Vein'));
      assert.ok(html.includes('Gather Time'));
      assert.ok(html.includes('Experience'));
    });

    it('returns empty for invalid node', () => {
      const html = renderNodeTooltip('nonexistent');
      assert.strictEqual(html, '');
    });

    it('renders tool tooltip', () => {
      const html = renderToolTooltip('steel_pickaxe');
      assert.ok(html.includes('tool-tooltip'));
      assert.ok(html.includes('Steel Pickaxe'));
      assert.ok(html.includes('Speed Bonus'));
    });

    it('returns empty for invalid tool', () => {
      const html = renderToolTooltip('nonexistent');
      assert.strictEqual(html, '');
    });
  });

  describe('Map Overlay Rendering', () => {
    it('renders map overlay', () => {
      const html = renderGatheringMapOverlay(state, 'forest', []);
      assert.ok(html.includes('gathering-map-overlay'));
      assert.ok(html.includes('Gathering Nodes'));
    });

    it('shows nodes on map', () => {
      const nodes = [{
        instanceId: 'test_1',
        nodeId: 'copper_vein',
        depleted: false
      }];
      const html = renderGatheringMapOverlay(state, 'forest', nodes);
      assert.ok(html.includes('Copper Vein'));
    });

    it('marks depleted nodes', () => {
      const nodes = [{
        instanceId: 'test_1',
        nodeId: 'copper_vein',
        depleted: true
      }];
      const html = renderGatheringMapOverlay(state, 'forest', nodes);
      assert.ok(html.includes('Depleted') || html.includes('depleted'));
    });
  });

  describe('CSS Styles', () => {
    it('returns CSS styles', () => {
      const css = getGatheringStyles();
      assert.ok(css.includes('.gathering-skill-panel'));
      assert.ok(css.includes('.gathering-progress'));
      assert.ok(css.includes('.gathering-result'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes HTML in node names', () => {
      const html = renderNodeSelectionPanel(state, 'mining');
      assert.ok(!html.includes('<script>'));
    });
  });
});

describe('Resource Gathering Integration', () => {
  let state;

  beforeEach(() => {
    state = {
      player: { name: 'TestHero' },
      gathering: initGatheringState()
    };
  });

  it('handles full gathering workflow', () => {
    // Equip tool
    let result = equipTool(state, 'basic_pickaxe');
    assert.ok(result.equipped);

    // Start gathering
    result = startGathering(result.state, 'copper_vein');
    assert.ok(result.started);

    // Force completion
    result.state.gathering.activeGathering.endTime = Date.now() - 1000;

    // Complete gathering
    const completeResult = completeGathering(result.state, () => 0.1);
    assert.ok(completeResult.completed);
    assert.ok(completeResult.gathered.length > 0);
  });

  it('maintains immutable state', () => {
    const originalState = { ...state };
    startGathering(state, 'copper_vein');
    assert.deepStrictEqual(state.gathering, originalState.gathering);
  });

  it('accumulates experience over multiple gathers', () => {
    let currentState = state;

    for (let i = 0; i < 3; i++) {
      let result = startGathering(currentState, 'copper_vein');
      result.state.gathering.activeGathering.endTime = Date.now() - 1000;
      const complete = completeGathering(result.state, () => 0.5);
      currentState = complete.state;
    }

    const progress = getSkillProgress(currentState, 'mining');
    assert.ok(progress.exp > 0 || progress.level > 1);
  });
});
