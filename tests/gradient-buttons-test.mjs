/**
 * Tests for gradient button theme integration
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { THEMES, DEFAULT_THEME, applyTheme, getThemeList } from '../src/data/themes.js';

describe('Gradient Button Theme Integration', () => {
  describe('Theme gradient colors', () => {
    it('all themes have gradientStart color', () => {
      for (const [themeId, theme] of Object.entries(THEMES)) {
        assert.ok(
          theme.colors.gradientStart,
          `Theme "${themeId}" should have gradientStart color`
        );
        assert.match(
          theme.colors.gradientStart,
          /^#[0-9a-fA-F]{6}$/,
          `Theme "${themeId}" gradientStart should be valid hex color`
        );
      }
    });

    it('all themes have gradientEnd color', () => {
      for (const [themeId, theme] of Object.entries(THEMES)) {
        assert.ok(
          theme.colors.gradientEnd,
          `Theme "${themeId}" should have gradientEnd color`
        );
        assert.match(
          theme.colors.gradientEnd,
          /^#[0-9a-fA-F]{6}$/,
          `Theme "${themeId}" gradientEnd should be valid hex color`
        );
      }
    });

    it('gradient colors are distinct from each other', () => {
      for (const [themeId, theme] of Object.entries(THEMES)) {
        assert.notStrictEqual(
          theme.colors.gradientStart,
          theme.colors.gradientEnd,
          `Theme "${themeId}" should have distinct gradient start and end colors`
        );
      }
    });
  });

  describe('applyTheme function', () => {
    it('handles missing document gracefully', () => {
      // Should not throw when document is undefined (Node.js environment)
      assert.doesNotThrow(() => {
        applyTheme('midnight');
      });
    });

    it('handles invalid theme ID gracefully', () => {
      assert.doesNotThrow(() => {
        applyTheme('nonexistent-theme');
      });
    });
  });

  describe('getThemeList function', () => {
    it('returns array of theme objects', () => {
      const list = getThemeList();
      assert.ok(Array.isArray(list), 'getThemeList should return an array');
      assert.ok(list.length > 0, 'Theme list should not be empty');
    });

    it('each theme has id and name properties', () => {
      const list = getThemeList();
      for (const theme of list) {
        assert.ok(theme.id, 'Theme should have id property');
        assert.ok(theme.name, 'Theme should have name property');
        assert.strictEqual(typeof theme.id, 'string');
        assert.strictEqual(typeof theme.name, 'string');
      }
    });

    it('includes all 5 themes', () => {
      const list = getThemeList();
      assert.strictEqual(list.length, 5, 'Should have exactly 5 themes');
      
      const ids = list.map(t => t.id);
      assert.ok(ids.includes('midnight'), 'Should include midnight theme');
      assert.ok(ids.includes('forest'), 'Should include forest theme');
      assert.ok(ids.includes('crimson'), 'Should include crimson theme');
      assert.ok(ids.includes('ocean'), 'Should include ocean theme');
      assert.ok(ids.includes('light'), 'Should include light theme');
    });
  });

  describe('Theme color integrity', () => {
    it('midnight theme has blue gradient', () => {
      assert.strictEqual(THEMES.midnight.colors.gradientStart, '#4a6cf7');
      assert.strictEqual(THEMES.midnight.colors.gradientEnd, '#7aa2ff');
    });

    it('forest theme has green gradient', () => {
      assert.strictEqual(THEMES.forest.colors.gradientStart, '#2d8a4e');
      assert.strictEqual(THEMES.forest.colors.gradientEnd, '#7aff7a');
    });

    it('crimson theme has red gradient', () => {
      assert.strictEqual(THEMES.crimson.colors.gradientStart, '#c44a4a');
      assert.strictEqual(THEMES.crimson.colors.gradientEnd, '#ff7a7a');
    });

    it('ocean theme has cyan gradient', () => {
      assert.strictEqual(THEMES.ocean.colors.gradientStart, '#2a7a8a');
      assert.strictEqual(THEMES.ocean.colors.gradientEnd, '#7affff');
    });

    it('light theme has blue gradient for visibility', () => {
      assert.strictEqual(THEMES.light.colors.gradientStart, '#4488dd');
      assert.strictEqual(THEMES.light.colors.gradientEnd, '#3366cc');
    });
  });
});

console.log('Running gradient buttons tests...');
