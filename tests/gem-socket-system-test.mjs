/**
 * Gem Socket System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  GEM_TYPES,
  GEM_QUALITY,
  SOCKET_TYPES,
  SOCKET_BONUS,
  initSocketState,
  createGem,
  addGem,
  removeGem,
  createSocketedItem,
  canSocketGem,
  socketGem,
  unsocketGem,
  combineGems,
  getItemSockets,
  getGemInventory,
  getGemsByType,
  getSocketStats,
  getSocketHistory
} from '../src/gem-socket-system.js';

import {
  renderSocketPanel,
  renderSocket,
  renderGemList,
  renderGemItem,
  renderGemInventoryGrouped,
  renderCombinePanel,
  renderGemTypesReference,
  renderQualityTiers,
  renderSocketTypes,
  renderSocketStats,
  renderSocketHistory,
  renderGemTooltip,
  renderCompactGemDisplay,
  renderSocketPreview
} from '../src/gem-socket-system-ui.js';

describe('Gem Socket System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initSocketState(state);
    state = result.state;
  });

  describe('GEM_TYPES', () => {
    it('has all gem types', () => {
      assert.ok(GEM_TYPES.RUBY);
      assert.ok(GEM_TYPES.SAPPHIRE);
      assert.ok(GEM_TYPES.EMERALD);
      assert.ok(GEM_TYPES.DIAMOND);
    });

    it('gems have stat and value', () => {
      Object.values(GEM_TYPES).forEach(gem => {
        assert.ok(gem.stat);
        assert.ok(typeof gem.baseValue === 'number');
      });
    });
  });

  describe('GEM_QUALITY', () => {
    it('has all qualities', () => {
      assert.ok(GEM_QUALITY.CHIPPED);
      assert.ok(GEM_QUALITY.REGULAR);
      assert.ok(GEM_QUALITY.PERFECT);
      assert.ok(GEM_QUALITY.RADIANT);
    });

    it('qualities have multiplier', () => {
      Object.values(GEM_QUALITY).forEach(q => {
        assert.ok(typeof q.multiplier === 'number');
      });
    });
  });

  describe('SOCKET_TYPES', () => {
    it('has socket types', () => {
      assert.ok(SOCKET_TYPES.RED);
      assert.ok(SOCKET_TYPES.BLUE);
      assert.ok(SOCKET_TYPES.PRISMATIC);
    });

    it('sockets have accepts list', () => {
      Object.values(SOCKET_TYPES).forEach(s => {
        assert.ok(Array.isArray(s.accepts));
      });
    });
  });

  describe('initSocketState', () => {
    it('creates initial state', () => {
      const result = initSocketState({});
      assert.ok(result.success);
      assert.deepStrictEqual(result.state.gemSocket.gems, {});
    });
  });

  describe('createGem', () => {
    it('creates a gem', () => {
      const result = createGem('ruby', 'regular');
      assert.ok(result.success);
      assert.ok(result.gem);
      assert.strictEqual(result.gem.type, 'ruby');
    });

    it('applies quality multiplier', () => {
      const chipped = createGem('ruby', 'chipped');
      const perfect = createGem('ruby', 'perfect');
      assert.ok(perfect.gem.value > chipped.gem.value);
    });

    it('fails for invalid type', () => {
      const result = createGem('invalid', 'regular');
      assert.ok(!result.gem);
    });

    it('fails for invalid quality', () => {
      const result = createGem('ruby', 'invalid');
      assert.ok(!result.gem);
    });
  });

  describe('addGem', () => {
    it('adds gem to inventory', () => {
      const gemResult = createGem('ruby', 'regular');
      const result = addGem(state, gemResult.gem);
      assert.ok(result.success);
      assert.ok(result.state.gemSocket.gems[gemResult.gem.id]);
    });

    it('fails for invalid gem', () => {
      const result = addGem(state, null);
      assert.ok(!result.success);
    });
  });

  describe('removeGem', () => {
    it('removes gem from inventory', () => {
      const gemResult = createGem('ruby', 'regular');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      
      result = removeGem(state, gemResult.gem.id);
      assert.ok(result.success);
      assert.ok(!result.state.gemSocket.gems[gemResult.gem.id]);
    });

    it('fails for non-existent gem', () => {
      const result = removeGem(state, 'fake_id');
      assert.ok(!result.success);
    });
  });

  describe('createSocketedItem', () => {
    it('creates socketed item', () => {
      const result = createSocketedItem(state, 'sword1', 3);
      assert.ok(result.success);
      assert.strictEqual(result.item.sockets.length, 3);
    });

    it('uses specified socket types', () => {
      const result = createSocketedItem(state, 'sword1', 2, ['red', 'blue']);
      assert.strictEqual(result.item.sockets[0].type, 'red');
      assert.strictEqual(result.item.sockets[1].type, 'blue');
    });

    it('fails without item id', () => {
      const result = createSocketedItem(state, null, 3);
      assert.ok(!result.success);
    });

    it('fails for invalid socket count', () => {
      let result = createSocketedItem(state, 'sword1', 0);
      assert.ok(!result.success);
      
      result = createSocketedItem(state, 'sword1', 7);
      assert.ok(!result.success);
    });

    it('fails if item already has sockets', () => {
      let result = createSocketedItem(state, 'sword1', 3);
      state = result.state;
      
      result = createSocketedItem(state, 'sword1', 2);
      assert.ok(!result.success);
    });
  });

  describe('canSocketGem', () => {
    let gemId;

    beforeEach(() => {
      const gemResult = createGem('ruby', 'regular');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      gemId = gemResult.gem.id;
      
      result = createSocketedItem(state, 'sword1', 2, ['red', 'blue']);
      state = result.state;
    });

    it('returns true for valid socket', () => {
      const result = canSocketGem(state, 'sword1', 0, gemId);
      assert.ok(result.canSocket);
    });

    it('returns false for wrong socket type', () => {
      const result = canSocketGem(state, 'sword1', 1, gemId); // blue socket
      assert.ok(!result.canSocket);
    });

    it('returns false for non-existent item', () => {
      const result = canSocketGem(state, 'fake_item', 0, gemId);
      assert.ok(!result.canSocket);
    });

    it('returns false for non-existent gem', () => {
      const result = canSocketGem(state, 'sword1', 0, 'fake_gem');
      assert.ok(!result.canSocket);
    });
  });

  describe('socketGem', () => {
    let gemId;

    beforeEach(() => {
      const gemResult = createGem('ruby', 'regular');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      gemId = gemResult.gem.id;
      
      result = createSocketedItem(state, 'sword1', 2, ['prismatic', 'prismatic']);
      state = result.state;
    });

    it('sockets a gem', () => {
      const result = socketGem(state, 'sword1', 0, gemId);
      assert.ok(result.success);
      assert.strictEqual(result.item.sockets[0].gemId, gemId);
    });

    it('removes gem from inventory', () => {
      const result = socketGem(state, 'sword1', 0, gemId);
      assert.ok(!result.state.gemSocket.gems[gemId]);
    });

    it('calculates total stats', () => {
      const result = socketGem(state, 'sword1', 0, gemId);
      assert.ok(result.item.totalStats['attack'] > 0);
    });

    it('increments stats', () => {
      const result = socketGem(state, 'sword1', 0, gemId);
      assert.strictEqual(result.state.gemSocket.stats.gemsSocketed, 1);
    });

    it('adds to history', () => {
      const result = socketGem(state, 'sword1', 0, gemId);
      assert.strictEqual(result.state.gemSocket.history.length, 1);
    });
  });

  describe('unsocketGem', () => {
    let gemId;

    beforeEach(() => {
      const gemResult = createGem('ruby', 'regular');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      gemId = gemResult.gem.id;
      
      result = createSocketedItem(state, 'sword1', 2, ['prismatic', 'prismatic']);
      state = result.state;
      
      result = socketGem(state, 'sword1', 0, gemId);
      state = result.state;
    });

    it('unsockets a gem', () => {
      const result = unsocketGem(state, 'sword1', 0);
      assert.ok(result.success);
      assert.strictEqual(result.item.sockets[0].gemId, null);
    });

    it('fails for empty socket', () => {
      const result = unsocketGem(state, 'sword1', 1);
      assert.ok(!result.success);
    });

    it('increments removed stats', () => {
      const result = unsocketGem(state, 'sword1', 0);
      assert.strictEqual(result.state.gemSocket.stats.gemsRemoved, 1);
    });
  });

  describe('combineGems', () => {
    it('combines 3 gems', () => {
      // Add 3 chipped rubies
      for (let i = 0; i < 3; i++) {
        const gemResult = createGem('ruby', 'chipped');
        const result = addGem(state, gemResult.gem);
        state = result.state;
      }
      
      const gemIds = Object.keys(state.gemSocket.gems);
      const result = combineGems(state, gemIds);
      
      assert.ok(result.success);
      assert.ok(result.newGem);
      assert.strictEqual(result.newGem.quality, 'flawed');
    });

    it('fails with less than 3 gems', () => {
      const gemResult = createGem('ruby', 'chipped');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      
      result = combineGems(state, [gemResult.gem.id]);
      assert.ok(!result.success);
    });

    it('fails with different types', () => {
      const ruby = createGem('ruby', 'chipped');
      const sapphire = createGem('sapphire', 'chipped');
      const emerald = createGem('emerald', 'chipped');
      
      let result = addGem(state, ruby.gem);
      state = result.state;
      result = addGem(state, sapphire.gem);
      state = result.state;
      result = addGem(state, emerald.gem);
      state = result.state;
      
      const gemIds = Object.keys(state.gemSocket.gems);
      result = combineGems(state, gemIds);
      assert.ok(!result.success);
    });

    it('fails with different qualities', () => {
      const chipped = createGem('ruby', 'chipped');
      const regular1 = createGem('ruby', 'regular');
      const regular2 = createGem('ruby', 'regular');
      
      let result = addGem(state, chipped.gem);
      state = result.state;
      result = addGem(state, regular1.gem);
      state = result.state;
      result = addGem(state, regular2.gem);
      state = result.state;
      
      const gemIds = Object.keys(state.gemSocket.gems);
      result = combineGems(state, gemIds);
      assert.ok(!result.success);
    });
  });

  describe('getItemSockets', () => {
    it('returns not found for unknown item', () => {
      const result = getItemSockets(state, 'unknown');
      assert.ok(!result.found);
    });

    it('returns socket info', () => {
      let result = createSocketedItem(state, 'sword1', 3);
      state = result.state;
      
      const info = getItemSockets(state, 'sword1');
      assert.ok(info.found);
      assert.strictEqual(info.emptySlots, 3);
    });
  });

  describe('getGemInventory', () => {
    it('returns empty array initially', () => {
      const gems = getGemInventory(state);
      assert.strictEqual(gems.length, 0);
    });

    it('returns gems', () => {
      const gemResult = createGem('ruby', 'regular');
      let result = addGem(state, gemResult.gem);
      state = result.state;
      
      const gems = getGemInventory(state);
      assert.strictEqual(gems.length, 1);
    });
  });

  describe('getGemsByType', () => {
    it('groups gems by type', () => {
      const ruby = createGem('ruby', 'regular');
      const sapphire = createGem('sapphire', 'regular');
      
      let result = addGem(state, ruby.gem);
      state = result.state;
      result = addGem(state, sapphire.gem);
      state = result.state;
      
      const grouped = getGemsByType(state);
      assert.ok(grouped['ruby']);
      assert.ok(grouped['sapphire']);
    });
  });

  describe('getSocketStats', () => {
    it('returns stats', () => {
      const stats = getSocketStats(state);
      assert.strictEqual(stats.totalGems, 0);
      assert.strictEqual(stats.gemsSocketed, 0);
    });
  });

  describe('getSocketHistory', () => {
    it('returns empty initially', () => {
      const history = getSocketHistory(state);
      assert.strictEqual(history.length, 0);
    });
  });
});

describe('Gem Socket System UI', () => {
  let state;

  beforeEach(() => {
    const result = initSocketState({});
    state = result.state;
  });

  describe('renderSocketPanel', () => {
    it('shows no sockets message for unknown item', () => {
      const html = renderSocketPanel(state, 'unknown');
      assert.ok(html.includes('no sockets'));
    });

    it('renders panel for socketed item', () => {
      let result = createSocketedItem(state, 'sword1', 2);
      state = result.state;
      
      const html = renderSocketPanel(state, 'sword1');
      assert.ok(html.includes('socket-panel'));
      assert.ok(html.includes('Gem Sockets'));
    });
  });

  describe('renderSocket', () => {
    it('renders empty socket', () => {
      const socket = { type: 'red', gemId: null, index: 0 };
      const html = renderSocket(state, 'sword1', socket, 0);
      assert.ok(html.includes('empty'));
      assert.ok(html.includes('Insert Gem'));
    });

    it('renders filled socket', () => {
      const socket = { type: 'red', gemId: 'gem123', index: 0 };
      const html = renderSocket(state, 'sword1', socket, 0);
      assert.ok(html.includes('filled'));
      assert.ok(html.includes('Remove'));
    });
  });

  describe('renderGemList', () => {
    it('shows no gems message', () => {
      const html = renderGemList([]);
      assert.ok(html.includes('No gems'));
    });

    it('renders gems', () => {
      const gem = createGem('ruby', 'regular').gem;
      const html = renderGemList([gem]);
      assert.ok(html.includes('gem-item'));
    });
  });

  describe('renderGemItem', () => {
    it('renders gem', () => {
      const gem = createGem('ruby', 'regular').gem;
      const html = renderGemItem(gem);
      assert.ok(html.includes('gem-item'));
      assert.ok(html.includes(gem.name));
    });
  });

  describe('renderGemInventoryGrouped', () => {
    it('shows empty message', () => {
      const html = renderGemInventoryGrouped(state);
      assert.ok(html.includes('No gems'));
    });
  });

  describe('renderCombinePanel', () => {
    it('renders combine panel', () => {
      const html = renderCombinePanel(state);
      assert.ok(html.includes('Combine Gems'));
      assert.ok(html.includes('combine-btn'));
    });
  });

  describe('renderGemTypesReference', () => {
    it('renders all gem types', () => {
      const html = renderGemTypesReference();
      assert.ok(html.includes('Gem Types'));
      assert.ok(html.includes('Ruby'));
      assert.ok(html.includes('Sapphire'));
    });
  });

  describe('renderQualityTiers', () => {
    it('renders quality table', () => {
      const html = renderQualityTiers();
      assert.ok(html.includes('Gem Quality'));
      assert.ok(html.includes('Chipped'));
      assert.ok(html.includes('Perfect'));
    });
  });

  describe('renderSocketTypes', () => {
    it('renders socket types', () => {
      const html = renderSocketTypes();
      assert.ok(html.includes('Socket Types'));
      assert.ok(html.includes('Prismatic'));
    });
  });

  describe('renderSocketStats', () => {
    it('renders stats', () => {
      const html = renderSocketStats(state);
      assert.ok(html.includes('Socket Statistics'));
      assert.ok(html.includes('Gems Owned'));
    });
  });

  describe('renderSocketHistory', () => {
    it('shows no history message', () => {
      const html = renderSocketHistory(state);
      assert.ok(html.includes('No socket history'));
    });
  });

  describe('renderGemTooltip', () => {
    it('renders tooltip', () => {
      const gem = createGem('ruby', 'regular').gem;
      const html = renderGemTooltip(gem);
      assert.ok(html.includes('gem-tooltip'));
      assert.ok(html.includes(gem.name));
    });
  });

  describe('renderCompactGemDisplay', () => {
    it('renders compact gem', () => {
      const gem = createGem('ruby', 'regular').gem;
      const html = renderCompactGemDisplay(gem);
      assert.ok(html.includes('gem-compact'));
    });
  });

  describe('renderSocketPreview', () => {
    it('shows invalid preview', () => {
      const html = renderSocketPreview(state, 'unknown', 0, 'unknown');
      assert.ok(html.includes('invalid'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes gem names', () => {
      const gem = {
        id: 'test',
        name: '<script>alert("xss")</script>',
        type: 'ruby',
        quality: 'regular',
        stat: 'attack',
        value: 5,
        color: '#ff0000'
      };
      
      const html = renderGemItem(gem);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });

    it('escapes item ids', () => {
      const socket = { type: 'red', gemId: null, index: 0 };
      const html = renderSocket(state, '<script>bad</script>', socket, 0);
      assert.ok(!html.includes('<script>bad</script>'));
    });
  });
});
