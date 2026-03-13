import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderAreaScene, getAreaSceneStyles } from '../src/area-scene-renderer.js';

describe('Area Scene Renderer', () => {
  it('returns empty string when phase is not exploration', () => {
    const state = { phase: 'combat', world: { roomRow: 1, roomCol: 1 } };
    assert.equal(renderAreaScene(state), '');
  });

  it('returns empty string for null state', () => {
    assert.equal(renderAreaScene(null), '');
  });

  it('returns empty string for undefined state', () => {
    assert.equal(renderAreaScene(undefined), '');
  });

  it('returns empty string for missing world data', () => {
    const state = { phase: 'exploration' };
    assert.equal(renderAreaScene(state), '');
  });

  it('returns empty string for invalid coordinates', () => {
    const state = { phase: 'exploration', world: { roomRow: 99, roomCol: 99 } };
    assert.equal(renderAreaScene(state), '');
  });

  it('renders area scene for Village Square (center)', () => {
    const state = { phase: 'exploration', world: { roomRow: 1, roomCol: 1 } };
    const html = renderAreaScene(state);
    assert.ok(html.includes('area-scene'), 'Should contain area-scene class');
    assert.ok(html.includes('data-room="center"'), 'Should identify center room');
    assert.ok(html.includes('Village Square'), 'Should show Village Square label');
    assert.ok(html.includes('area-player-marker'), 'Should have player marker');
  });

  it('renders area scene for Northwest Grove', () => {
    const state = { phase: 'exploration', world: { roomRow: 0, roomCol: 0 } };
    const html = renderAreaScene(state);
    assert.ok(html.includes('data-room="nw"'), 'Should identify nw room');
    assert.ok(html.includes('Northwest Grove'), 'Should show Northwest Grove label');
    assert.ok(html.includes('tree'), 'NW should have tree elements');
  });

  it('renders area scene for Southeast Dock', () => {
    const state = { phase: 'exploration', world: { roomRow: 2, roomCol: 2 } };
    const html = renderAreaScene(state);
    assert.ok(html.includes('data-room="se"'), 'Should identify se room');
    assert.ok(html.includes('Southeast Dock'), 'Should show Southeast Dock label');
    assert.ok(html.includes('dock'), 'SE should have dock elements');
    assert.ok(html.includes('wave'), 'SE should have wave elements');
  });

  it('renders all 9 rooms without errors', () => {
    const coords = [
      [0, 0], [0, 1], [0, 2],
      [1, 0], [1, 1], [1, 2],
      [2, 0], [2, 1], [2, 2],
    ];
    for (const [row, col] of coords) {
      const state = { phase: 'exploration', world: { roomRow: row, roomCol: col } };
      const html = renderAreaScene(state);
      assert.ok(html.includes('area-scene'), `Room [${row},${col}] should render area-scene`);
      assert.ok(html.includes('area-player-marker'), `Room [${row},${col}] should have player marker`);
      assert.ok(html.includes('area-scene-label'), `Room [${row},${col}] should have label`);
    }
  });

  it('player marker position uses state coordinates', () => {
    const state = {
      phase: 'exploration',
      world: { roomRow: 1, roomCol: 1, x: 3, y: 2 },
      worldData: { roomWidth: 10, roomHeight: 10 },
    };
    const html = renderAreaScene(state);
    assert.ok(html.includes('area-player-marker'), 'Should have player marker');
    assert.ok(html.includes('left:'), 'Player marker should have left style');
    assert.ok(html.includes('bottom:'), 'Player marker should have bottom style');
  });

  it('renders NPC icons when NPCs are present in room', () => {
    // Village Square (center) has NPCs defined in npc-dialog.js
    const state = { phase: 'exploration', world: { roomRow: 1, roomCol: 1 } };
    const html = renderAreaScene(state);
    assert.ok(html.includes('area-scene-npc'), 'Center should show NPC icons');
  });

  it('escapes HTML in labels', () => {
    // All room labels are safe, but the esc function should work
    const state = { phase: 'exploration', world: { roomRow: 0, roomCol: 1 } };
    const html = renderAreaScene(state);
    assert.ok(html.includes('Northern Path'), 'Should render Northern Path label');
    assert.ok(!html.includes('<script'), 'Should not contain raw HTML tags');
  });
});

describe('Area Scene Styles', () => {
  it('returns a non-empty CSS string', () => {
    const css = getAreaSceneStyles();
    assert.ok(typeof css === 'string', 'Should return a string');
    assert.ok(css.length > 100, 'Should have substantial CSS content');
  });

  it('includes key CSS classes', () => {
    const css = getAreaSceneStyles();
    assert.ok(css.includes('.area-scene'), 'Should style .area-scene');
    assert.ok(css.includes('.area-scene-label'), 'Should style .area-scene-label');
    assert.ok(css.includes('.area-player-marker'), 'Should style .area-player-marker');
    assert.ok(css.includes('.area-scene-npc'), 'Should style .area-scene-npc');
  });

  it('includes exit lock styles', () => {
    const css = getAreaSceneStyles();
    assert.ok(css.includes('.area-scene-exit-lock'), 'Should style exit locks');
  });
});
