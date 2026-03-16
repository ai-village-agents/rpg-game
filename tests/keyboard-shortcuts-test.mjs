/**
 * Tests for keyboard-shortcuts.js
 */

import assert from 'node:assert';
import { describe, it, beforeEach, afterEach } from 'node:test';

// --- Minimal DOM shims for Node ---
function createMockDOM() {
  const elements = {};
  const eventListeners = {};
  const headChildren = [];

  const mockDocument = {
    getElementById(id) { return elements[id] || null; },
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        id: '',
        textContent: '',
        innerHTML: '',
        children: [],
        style: {},
        remove() { delete elements[this.id]; },
        appendChild(child) { this.children.push(child); },
      };
      return el;
    },
    body: {
      appendChild(el) { elements[el.id] = el; },
    },
    head: {
      appendChild(el) {
        headChildren.push(el);
        if (el.id) elements[el.id] = el;
      },
    },
  };

  const mockWindow = {
    addEventListener(type, fn) {
      if (!eventListeners[type]) eventListeners[type] = [];
      eventListeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (!eventListeners[type]) return;
      eventListeners[type] = eventListeners[type].filter(f => f !== fn);
    },
  };

  function fireKeydown(key, opts = {}) {
    const event = {
      key,
      target: opts.target || { tagName: 'DIV' },
      preventDefault: opts.preventDefault || (() => {}),
    };
    for (const fn of (eventListeners['keydown'] || [])) {
      fn(event);
    }
    return event;
  }

  return { mockDocument, mockWindow, fireKeydown, elements, eventListeners, headChildren };
}

// Set up global shims
let domMock;

function setupGlobals() {
  domMock = createMockDOM();
  globalThis.window = domMock.mockWindow;
  globalThis.document = domMock.mockDocument;
}

function teardownGlobals() {
  delete globalThis.window;
  delete globalThis.document;
}

describe('KeyboardShortcuts', () => {
  let KeyboardShortcuts, createKeyboardShortcuts, COMBAT_KEYS, EXPLORATION_KEYS, SUB_MENU_PHASES;
  let dispatched;
  let currentState;
  let getState;
  let dispatch;

  beforeEach(async () => {
    setupGlobals();
    dispatched = [];
    currentState = { phase: 'exploration' };
    getState = () => currentState;
    dispatch = (action) => dispatched.push(action);

    // Dynamic import to pick up global shims
    const mod = await import('../src/keyboard-shortcuts.js');
    KeyboardShortcuts = mod.KeyboardShortcuts;
    createKeyboardShortcuts = mod.createKeyboardShortcuts;
    COMBAT_KEYS = mod.COMBAT_KEYS;
    EXPLORATION_KEYS = mod.EXPLORATION_KEYS;
    SUB_MENU_PHASES = mod.SUB_MENU_PHASES;
  });

  afterEach(() => {
    teardownGlobals();
  });

  describe('constructor and lifecycle', () => {
    it('should create an instance without throwing', () => {
      const ks = new KeyboardShortcuts(getState, dispatch);
      assert.ok(ks);
    });

    it('init should register a keydown listener', () => {
      const ks = new KeyboardShortcuts(getState, dispatch);
      ks.init();
      assert.ok(domMock.eventListeners['keydown']?.length > 0, 'Should have keydown listener');
      ks.destroy();
    });

    it('destroy should remove the keydown listener', () => {
      const ks = new KeyboardShortcuts(getState, dispatch);
      ks.init();
      const countBefore = domMock.eventListeners['keydown']?.length || 0;
      ks.destroy();
      const countAfter = domMock.eventListeners['keydown']?.length || 0;
      assert.ok(countAfter < countBefore, 'Listener count should decrease');
    });

    it('createKeyboardShortcuts factory should return an initialized instance', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      assert.ok(ks instanceof KeyboardShortcuts);
      assert.ok(domMock.eventListeners['keydown']?.length > 0);
      ks.destroy();
    });
  });

  describe('combat shortcuts', () => {
    it('should dispatch PLAYER_ATTACK on key 1 during player-turn', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('1');
      assert.deepStrictEqual(dispatched, [{ type: 'PLAYER_ATTACK' }]);
      ks.destroy();
    });

    it('should dispatch PLAYER_DEFEND on key 2 during player-turn', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('2');
      assert.deepStrictEqual(dispatched, [{ type: 'PLAYER_DEFEND' }]);
      ks.destroy();
    });

    it('should dispatch PLAYER_POTION on key 3 during player-turn', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('3');
      assert.deepStrictEqual(dispatched, [{ type: 'PLAYER_POTION' }]);
      ks.destroy();
    });

    it('should dispatch PLAYER_FLEE on key 4 during player-turn', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('4');
      assert.deepStrictEqual(dispatched, [{ type: 'PLAYER_FLEE' }]);
      ks.destroy();
    });

    it('should NOT dispatch combat keys during enemy-turn', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'enemy-turn' };
      domMock.fireKeydown('1');
      domMock.fireKeydown('2');
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });

    it('should NOT dispatch combat keys during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('1');
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });
  });

  describe('exploration shortcuts', () => {
    it('should dispatch VIEW_INVENTORY on i during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('i');
      assert.deepStrictEqual(dispatched, [{ type: 'VIEW_INVENTORY' }]);
      ks.destroy();
    });

    it('should dispatch VIEW_INVENTORY on I (uppercase) during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('I');
      assert.deepStrictEqual(dispatched, [{ type: 'VIEW_INVENTORY' }]);
      ks.destroy();
    });

    it('should dispatch OPEN_JOURNAL on j during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('j');
      assert.deepStrictEqual(dispatched, [{ type: 'OPEN_JOURNAL' }]);
      ks.destroy();
    });

    it('should dispatch VIEW_CRAFTING on c during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('c');
      assert.deepStrictEqual(dispatched, [{ type: 'VIEW_CRAFTING' }]);
      ks.destroy();
    });

    it('should dispatch VIEW_TALENTS on t during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('t');
      assert.deepStrictEqual(dispatched, [{ type: 'VIEW_TALENTS' }]);
      ks.destroy();
    });

    it('should dispatch VIEW_QUESTS on q during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('q');
      assert.deepStrictEqual(dispatched, [{ type: 'VIEW_QUESTS' }]);
      ks.destroy();
    });

    it('should dispatch OPEN_PROVISIONS on p during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('p');
      assert.deepStrictEqual(dispatched, [{ type: 'OPEN_PROVISIONS' }]);
      ks.destroy();
    });

    it('should dispatch OPEN_FAST_TRAVEL on f during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('f');
      assert.deepStrictEqual(dispatched, [{ type: 'OPEN_FAST_TRAVEL' }]);
      ks.destroy();
    });

    it('should dispatch OPEN_COMPANIONS on k during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('k');
      assert.deepStrictEqual(dispatched, [{ type: 'OPEN_COMPANIONS' }]);
      ks.destroy();
    });

    it('should dispatch OPEN_FACTIONS on n during exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('n');
      assert.deepStrictEqual(dispatched, [{ type: 'OPEN_FACTIONS' }]);
      ks.destroy();
    });

    it('should NOT dispatch exploration keys during combat', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('i');
      domMock.fireKeydown('j');
      domMock.fireKeydown('c');
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });
  });

  describe('universal shortcuts', () => {
    it('should dispatch the correct CLOSE action on Escape from sub-menu phases', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      const phases = [
        { phase: 'inventory', action: 'CLOSE_INVENTORY' },
        { phase: 'quests', action: 'CLOSE_QUESTS' },
        { phase: 'journal', action: 'CLOSE_JOURNAL' },
        { phase: 'crafting', action: 'CLOSE_CRAFTING' },
        { phase: 'talents', action: 'CLOSE_TALENTS' },
        { phase: 'shop', action: 'CLOSE_SHOP' },
        { phase: 'settings', action: 'CLOSE_SETTINGS' },
      ];
      for (const { phase, action } of phases) {
        dispatched = [];
        currentState = { phase };
        domMock.fireKeydown('Escape');
        assert.deepStrictEqual(dispatched, [{ type: action }], `Should dispatch ${action} from ${phase}`);
      }
      ks.destroy();
    });

    it('should NOT dispatch GO_BACK on Escape from exploration', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      domMock.fireKeydown('Escape');
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });

    it('should dispatch CONTINUE_AFTER_BATTLE on Enter from battle-summary', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'battle-summary' };
      domMock.fireKeydown('Enter');
      assert.deepStrictEqual(dispatched, [{ type: 'CONTINUE_AFTER_BATTLE' }]);
      ks.destroy();
    });

    it('should dispatch CONTINUE_EXPLORING on Enter from victory', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'victory' };
      domMock.fireKeydown('Enter');
      assert.deepStrictEqual(dispatched, [{ type: 'CONTINUE_EXPLORING' }]);
      ks.destroy();
    });

    it('should dispatch TRY_AGAIN on Enter from defeat', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'defeat' };
      domMock.fireKeydown('Enter');
      assert.deepStrictEqual(dispatched, [{ type: 'TRY_AGAIN' }]);
      ks.destroy();
    });

    it('should dispatch CONTINUE_AFTER_FLEE on Enter from fled', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'fled' };
      domMock.fireKeydown('Enter');
      assert.deepStrictEqual(dispatched, [{ type: 'CONTINUE_AFTER_FLEE' }]);
      ks.destroy();
    });
  });

  describe('input filtering', () => {
    it('should ignore keys when target is INPUT', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('1', { target: { tagName: 'INPUT' } });
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });

    it('should ignore keys when target is TEXTAREA', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('1', { target: { tagName: 'TEXTAREA' } });
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });

    it('should ignore keys when target is contentEditable', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      domMock.fireKeydown('1', { target: { tagName: 'DIV', isContentEditable: true } });
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });
  });

  describe('help overlay', () => {
    it('should show overlay on / key press', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      domMock.fireKeydown('/');
      assert.ok(ks._overlayVisible, 'Overlay should be visible');
      ks.destroy();
    });

    it('should hide overlay on second / key press', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      domMock.fireKeydown('/');
      assert.ok(ks._overlayVisible);
      domMock.fireKeydown('/');
      assert.ok(!ks._overlayVisible, 'Overlay should be hidden');
      ks.destroy();
    });

    it('should hide overlay on Escape when overlay is visible', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      domMock.fireKeydown('/');
      assert.ok(ks._overlayVisible);
      domMock.fireKeydown('Escape');
      assert.ok(!ks._overlayVisible);
      // Should NOT have dispatched GO_BACK
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });
  });

  describe('null state handling', () => {
    it('should not throw when getState returns null', () => {
      const ks = createKeyboardShortcuts(() => null, dispatch);
      assert.doesNotThrow(() => domMock.fireKeydown('1'));
      assert.deepStrictEqual(dispatched, []);
      ks.destroy();
    });
  });

  describe('preventDefault', () => {
    it('should call preventDefault for matched combat keys', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'player-turn' };
      let prevented = false;
      domMock.fireKeydown('1', { preventDefault: () => { prevented = true; } });
      assert.ok(prevented, 'preventDefault should have been called');
      ks.destroy();
    });

    it('should call preventDefault for matched exploration keys', () => {
      const ks = createKeyboardShortcuts(getState, dispatch);
      currentState = { phase: 'exploration' };
      let prevented = false;
      domMock.fireKeydown('i', { preventDefault: () => { prevented = true; } });
      assert.ok(prevented, 'preventDefault should have been called');
      ks.destroy();
    });
  });

  describe('exported constants', () => {
    it('COMBAT_KEYS should have 4 entries', () => {
      assert.strictEqual(Object.keys(COMBAT_KEYS).length, 4);
    });

    it('EXPLORATION_KEYS should have entries for both cases', () => {
      assert.ok(EXPLORATION_KEYS['i']);
      assert.ok(EXPLORATION_KEYS['I']);
      assert.deepStrictEqual(EXPLORATION_KEYS['i'], EXPLORATION_KEYS['I']);
    });

    it('SUB_MENU_PHASES should be a Set', () => {
      assert.ok(SUB_MENU_PHASES instanceof Set);
      assert.ok(SUB_MENU_PHASES.has('inventory'));
      assert.ok(SUB_MENU_PHASES.has('shop'));
    });
  });
});
