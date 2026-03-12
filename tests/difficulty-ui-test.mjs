/**
 * Tests for Difficulty Settings UI Module
 * Created by Claude Opus 4.5 (Day 345)
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

import {
  renderDifficultyPanel,
  renderDifficultyIndicator,
  getDifficultyStyles,
} from '../src/difficulty-ui.js';

import { DIFFICULTY_LEVELS, DEFAULT_DIFFICULTY } from '../src/difficulty.js';

describe('Difficulty UI Module', () => {
  describe('renderDifficultyPanel', () => {
    it('should render a difficulty panel', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('difficulty-panel'));
      assert.ok(html.includes('Game Difficulty'));
    });

    it('should render all four difficulty levels', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('Easy'));
      assert.ok(html.includes('Normal'));
      assert.ok(html.includes('Hard'));
      assert.ok(html.includes('Nightmare'));
    });

    it('should mark the selected difficulty', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.HARD);
      // The selected card should have the selected class
      assert.ok(html.includes('data-difficulty="hard"'));
      // Check for selected badge near hard
      const hardSection = html.split('data-difficulty="hard"')[1];
      assert.ok(hardSection.includes('selected'));
    });

    it('should show multipliers by default', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('Enemy Dmg'));
      assert.ok(html.includes('Enemy HP'));
      assert.ok(html.includes('XP Reward'));
      assert.ok(html.includes('Gold Reward'));
    });

    it('should hide multipliers when showMultipliers is false', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL, { showMultipliers: false });
      assert.ok(!html.includes('diff-multipliers'));
    });

    it('should include select buttons for non-selected difficulties', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      // Should have select buttons for easy, hard, nightmare but not normal
      const selectBtnCount = (html.match(/diff-select-btn/g) || []).length;
      assert.strictEqual(selectBtnCount, 3);
    });

    it('should render compact mode when specified', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL, { compact: true });
      assert.ok(html.includes('difficulty-compact'));
      assert.ok(html.includes('difficultySelect'));
    });

    it('should handle undefined difficulty by using default', () => {
      const html = renderDifficultyPanel(undefined);
      // Should still render with normal selected
      assert.ok(html.includes('difficulty-panel'));
    });

    it('should include difficulty descriptions', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('Perfect for enjoying the story'));
      assert.ok(html.includes('standard experience'));
      assert.ok(html.includes('Not for the faint of heart'));
    });

    it('should include difficulty icons', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('🌱')); // Easy
      assert.ok(html.includes('⚔️')); // Normal
      assert.ok(html.includes('🔥')); // Hard
      assert.ok(html.includes('💀')); // Nightmare
    });
  });

  describe('renderDifficultyIndicator', () => {
    it('should render indicator with icon and name', () => {
      const html = renderDifficultyIndicator(DIFFICULTY_LEVELS.NORMAL);
      assert.ok(html.includes('diff-indicator'));
      assert.ok(html.includes('⚔️'));
      assert.ok(html.includes('Normal'));
    });

    it('should use appropriate color for each difficulty', () => {
      const easyHtml = renderDifficultyIndicator(DIFFICULTY_LEVELS.EASY);
      const hardHtml = renderDifficultyIndicator(DIFFICULTY_LEVELS.HARD);
      
      assert.ok(easyHtml.includes('#4ade80')); // Green
      assert.ok(hardHtml.includes('#f97316')); // Orange
    });

    it('should include title attribute for tooltip', () => {
      const html = renderDifficultyIndicator(DIFFICULTY_LEVELS.NIGHTMARE);
      assert.ok(html.includes('title="Difficulty: Nightmare"'));
    });
  });

  describe('getDifficultyStyles', () => {
    it('should return CSS string', () => {
      const css = getDifficultyStyles();
      assert.ok(typeof css === 'string');
      assert.ok(css.length > 0);
    });

    it('should include styles for main panel', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.difficulty-panel'));
      assert.ok(css.includes('.diff-card'));
      assert.ok(css.includes('.diff-header'));
    });

    it('should include styles for compact mode', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.difficulty-compact'));
      assert.ok(css.includes('.diff-compact-row'));
      assert.ok(css.includes('.diff-select'));
    });

    it('should include styles for indicator', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.diff-indicator'));
    });

    it('should include multiplier styling classes', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.diff-mult'));
      assert.ok(css.includes('.diff-mult.good'));
      assert.ok(css.includes('.diff-mult.bad'));
      assert.ok(css.includes('.diff-mult.neutral'));
    });

    it('should include selected state styling', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.diff-card.selected'));
      assert.ok(css.includes('.diff-selected-badge'));
    });

    it('should include hover effects', () => {
      const css = getDifficultyStyles();
      assert.ok(css.includes('.diff-card:hover'));
      assert.ok(css.includes('.diff-select-btn:hover'));
    });
  });

  describe('compact mode specifics', () => {
    it('should render dropdown with all options', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.HARD, { compact: true });
      assert.ok(html.includes('<option value="easy"'));
      assert.ok(html.includes('<option value="normal"'));
      assert.ok(html.includes('<option value="hard"'));
      assert.ok(html.includes('<option value="nightmare"'));
    });

    it('should mark current difficulty as selected in dropdown', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.HARD, { compact: true });
      assert.ok(html.includes('value="hard" selected'));
    });

    it('should show preview description for current difficulty', () => {
      const html = renderDifficultyPanel(DIFFICULTY_LEVELS.NIGHTMARE, { compact: true });
      assert.ok(html.includes('Not for the faint of heart'));
    });
  });
});
