/**
 * UI/Renderer Module Tests
 * Tests canvas-based rendering with DOM mocking
 * Owner: Claude Sonnet 4.5
 */

// Mock canvas context with spy methods
class MockCanvasContext {
  constructor() {
    this.calls = [];
  }
  
  fillRect(...args) { this.calls.push(['fillRect', args]); }
  strokeRect(...args) { this.calls.push(['strokeRect', args]); }
  fillText(...args) { this.calls.push(['fillText', args]); }
  beginPath() { this.calls.push(['beginPath', []]); }
  arc(...args) { this.calls.push(['arc', args]); }
  fill() { this.calls.push(['fill', []]); }
  stroke() { this.calls.push(['stroke', []]); }
  save() { this.calls.push(['save', []]); }
  restore() { this.calls.push(['restore', []]); }
  measureText(text) { 
    this.calls.push(['measureText', [text]]); 
    return { width: text.length * 8 };
  }
  
  reset() { this.calls = []; }
  hasCalled(method) { return this.calls.some(c => c[0] === method); }
}

// Mock canvas element
class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.mockContext = new MockCanvasContext();
  }
  
  getContext(type) {
    if (type === '2d') return this.mockContext;
    return null;
  }
}

// Mock document
const mockCanvas = new MockCanvas();
global.document = {
  getElementById: (id) => {
    if (id === 'game-canvas') return mockCanvas;
    return null;
  }
};

// Import renderer after mocking
const { Renderer } = await import('../src/ui/renderer.js');

// Test utilities
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ✗ ${message}`);
    failed++;
  } else {
    console.log(`  ✓ ${message}`);
    passed++;
  }
}

// Test: Renderer initialization
console.log('\nTest: Renderer initialization');
try {
  const renderer = new Renderer('game-canvas');
  assert(renderer.canvas === mockCanvas, 'Canvas element retrieved');
  assert(renderer.ctx === mockCanvas.mockContext, 'Context initialized');
} catch (e) {
  assert(false, `Initialization failed: ${e.message}`);
}

// Test: clear() method
console.log('\nTest: clear() method');
try {
  const renderer = new Renderer('game-canvas');
  mockCanvas.mockContext.reset();
  renderer.clear();
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'clear() calls fillRect');
} catch (e) {
  assert(false, `clear() failed: ${e.message}`);
}

// Test: renderGame() with exploration phase
console.log('\nTest: renderGame() with exploration phase');
try {
  const renderer = new Renderer('game-canvas');
  const gameState = {
    phase: 'exploration',
    world: {
      currentX: 1,
      currentY: 1,
      grid: Array(3).fill(null).map(() => Array(3).fill({ type: 'empty' }))
    },
    party: [
      { name: 'Hero', hp: 50, maxHp: 100, mp: 30, maxMp: 50, class: 'warrior' }
    ],
    turnCount: 5,
    gold: 100
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderGame(gameState);
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'Exploration renders shapes');
  assert(mockCanvas.mockContext.hasCalled('fillText'), 'Exploration renders text');
} catch (e) {
  assert(false, `renderGame(exploration) failed: ${e.message}`);
}

// Test: renderGame() with battle phase
console.log('\nTest: renderGame() with battle phase');
try {
  const renderer = new Renderer('game-canvas');
  const gameState = {
    phase: 'battle',
    combat: {
      enemies: [
        { name: 'Goblin', hp: 20, maxHp: 30 }
      ],
      party: [
        { name: 'Hero', hp: 50, maxHp: 100 }
      ],
      turnPhase: 'player_select',
      selectedAction: null
    }
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderGame(gameState);
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'Battle renders shapes');
  assert(mockCanvas.mockContext.hasCalled('fillText'), 'Battle renders text');
} catch (e) {
  assert(false, `renderGame(battle) failed: ${e.message}`);
}

// Test: renderMap() with valid world
console.log('\nTest: renderMap() with valid world');
try {
  const renderer = new Renderer('game-canvas');
  const gameState = {
    world: {
      currentX: 1,
      currentY: 1,
      grid: Array(3).fill(null).map(() => Array(3).fill({ type: 'room', visited: true }))
    }
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderMap(gameState);
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'renderMap() draws rooms');
  assert(mockCanvas.mockContext.hasCalled('arc'), 'renderMap() draws player');
} catch (e) {
  assert(false, `renderMap() failed: ${e.message}`);
}

// Test: renderHUD() with party data
console.log('\nTest: renderHUD() with party data');
try {
  const renderer = new Renderer('game-canvas');
  const gameState = {
    party: [
      { name: 'Hero', hp: 75, maxHp: 100, mp: 25, maxMp: 50 }
    ],
    turnCount: 10,
    gold: 250
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderHUD(gameState);
  assert(mockCanvas.mockContext.hasCalled('fillText'), 'HUD renders text');
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'HUD renders health bars');
} catch (e) {
  assert(false, `renderHUD() failed: ${e.message}`);
}

// Test: renderBattle() with enemies
console.log('\nTest: renderBattle() with enemies');
try {
  const renderer = new Renderer('game-canvas');
  const combat = {
    enemies: [
      { name: 'Goblin', hp: 20, maxHp: 30 },
      { name: 'Orc', hp: 40, maxHp: 50 }
    ],
    party: [
      { name: 'Hero', hp: 50, maxHp: 100 }
    ]
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderBattle(combat);
  assert(mockCanvas.mockContext.hasCalled('fillText'), 'Battle renders names');
  assert(mockCanvas.mockContext.hasCalled('fillRect'), 'Battle renders health bars');
} catch (e) {
  assert(false, `renderBattle() failed: ${e.message}`);
}

// Test: renderBattleUI() with action buttons
console.log('\nTest: renderBattleUI() with action buttons');
try {
  const renderer = new Renderer('game-canvas');
  const combat = {
    turnPhase: 'player_select',
    selectedAction: null
  };
  
  mockCanvas.mockContext.reset();
  renderer.renderBattleUI(combat);
  assert(mockCanvas.mockContext.hasCalled('strokeRect') || mockCanvas.mockContext.hasCalled('fillRect'), 'Battle UI renders buttons');
} catch (e) {
  assert(false, `renderBattleUI() failed: ${e.message}`);
}

// Summary
console.log(`\n${'='.repeat(50)}`);
console.log(`UI/Renderer Tests: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
