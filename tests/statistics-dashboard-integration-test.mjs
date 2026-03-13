/**
 * Tests for Statistics Dashboard Integration
 * Ensures the dashboard integrates properly with the game menu system
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  renderStatsDashboardPhase,
  renderStatsDashboardActions,
  attachStatsDashboardHandlers,
  initStatsDashboard,
  isStatsDashboardOpen,
  getStatsDashboardIntegrationStyles
} from '../src/statistics-dashboard-integration.js';
import { createEmptyStatistics } from '../src/statistics-dashboard.js';
import { JSDOM } from 'jsdom';

describe('Statistics Dashboard Integration', () => {
  let dom;
  let document;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="hud"></div><div id="actions"></div></body></html>');
    document = dom.window.document;
    global.document = document;
  });

  describe('getStatsDashboardIntegrationStyles', () => {
    it('should return CSS string', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.strictEqual(typeof styles, 'string');
      assert.ok(styles.length > 0);
    });

    it('should include container styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-container'));
    });

    it('should include close button styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-close-btn'));
    });

    it('should include actions styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes('.stats-dashboard-actions'));
    });

    it('should include hover styles', () => {
      const styles = getStatsDashboardIntegrationStyles();
      assert.ok(styles.includes(':hover'));
    });
  });

  describe('renderStatsDashboardPhase', () => {
    it('should render dashboard container', () => {
      const state = { statistics: createEmptyStatistics() };
      const html = renderStatsDashboardPhase(state);
      assert.ok(html.includes('stats-dashboard-container'));
    });

    it('should render with empty state', () => {
      const state = {};
      const html = renderStatsDashboardPhase(state);
      assert.strictEqual(typeof html, 'string');
      assert.ok(html.length > 0);
    });

    it('should include dashboard content', () => {
      const state = { statistics: createEmptyStatistics() };
      const html = renderStatsDashboardPhase(state);
      assert.ok(html.includes('stats-dashboard'));
    });
  });

  describe('renderStatsDashboardActions', () => {
    it('should render close button', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('btnCloseStatsDashboard'));
    });

    it('should include buttons class', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('buttons'));
    });

    it('should include close text', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('Close Statistics'));
    });

    it('should include chart emoji', () => {
      const html = renderStatsDashboardActions();
      assert.ok(html.includes('📊'));
    });
  });

  describe('attachStatsDashboardHandlers', () => {
    it('should attach close button handler', () => {
      const actionsDiv = document.getElementById('actions');
      actionsDiv.innerHTML = renderStatsDashboardActions();
      
      let dispatched = null;
      const dispatch = (action) => { dispatched = action; };
      
      attachStatsDashboardHandlers(document, dispatch);
      
      const closeBtn = document.getElementById('btnCloseStatsDashboard');
      assert.ok(closeBtn);
      closeBtn.click();
      
      assert.deepStrictEqual(dispatched, { type: 'CLOSE_STATISTICS_DASHBOARD' });
    });

    it('should handle missing button gracefully', () => {
      const dispatch = () => {};
      // Should not throw
      attachStatsDashboardHandlers(document, dispatch);
    });
  });

  describe('initStatsDashboard', () => {
    it('should inject integration styles', () => {
      initStatsDashboard(document);
      const styleEl = document.getElementById('stats-dashboard-integration-styles');
      assert.ok(styleEl);
    });

    it('should not duplicate styles on multiple calls', () => {
      initStatsDashboard(document);
      initStatsDashboard(document);
      const styleEls = document.querySelectorAll('#stats-dashboard-integration-styles');
      assert.strictEqual(styleEls.length, 1);
    });

    it('should inject dashboard UI styles', () => {
      initStatsDashboard(document);
      const styleEl = document.getElementById('stats-dashboard-integration-styles');
      assert.ok(styleEl);
    });
  });

  describe('isStatsDashboardOpen', () => {
    it('should return true when phase is statistics-dashboard', () => {
      const state = { phase: 'statistics-dashboard' };
      assert.strictEqual(isStatsDashboardOpen(state), true);
    });

    it('should return false for other phases', () => {
      assert.strictEqual(isStatsDashboardOpen({ phase: 'exploration' }), false);
      assert.strictEqual(isStatsDashboardOpen({ phase: 'combat' }), false);
      assert.strictEqual(isStatsDashboardOpen({ phase: 'stats' }), false);
    });

    it('should return false for undefined phase', () => {
      assert.strictEqual(isStatsDashboardOpen({}), false);
    });
  });
});

describe('UI Handler Integration', () => {
  it('should handle OPEN_STATISTICS_DASHBOARD action', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'exploration' };
    const result = handleUIAction(state, { type: 'OPEN_STATISTICS_DASHBOARD' });
    
    assert.strictEqual(result.phase, 'statistics-dashboard');
    assert.strictEqual(result.previousPhase, 'exploration');
  });

  it('should handle CLOSE_STATISTICS_DASHBOARD action', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'statistics-dashboard', previousPhase: 'exploration' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });
    
    assert.strictEqual(result.phase, 'exploration');
  });

  it('should return null for CLOSE when not in dashboard phase', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'exploration' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });
    
    assert.strictEqual(result, null);
  });

  it('should default to exploration when no previousPhase', async () => {
    const { handleUIAction } = await import('../src/handlers/ui-handler.js');
    const state = { phase: 'statistics-dashboard' };
    const result = handleUIAction(state, { type: 'CLOSE_STATISTICS_DASHBOARD' });
    
    assert.strictEqual(result.phase, 'exploration');
  });
});

describe('Render Integration', () => {
  it('should have button in exploration menu HTML', async () => {
    // This test verifies the button was added to render.js
    const fs = await import('fs');
    const renderContent = fs.readFileSync('./src/render.js', 'utf8');
    
    assert.ok(renderContent.includes('btnStatsDashboard'));
    assert.ok(renderContent.includes('OPEN_STATISTICS_DASHBOARD'));
  });

  it('should have statistics-dashboard phase handling', async () => {
    const fs = await import('fs');
    const renderContent = fs.readFileSync('./src/render.js', 'utf8');
    
    assert.ok(renderContent.includes("phase === 'statistics-dashboard'"));
    assert.ok(renderContent.includes('renderStatsDashboardPhase'));
  });
});
