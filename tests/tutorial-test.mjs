import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  TUTORIAL_STEPS,
  createTutorialState,
  getTutorialHint,
  completeTutorialStep,
  dismissCurrentHint,
  showHint,
  resetTutorial,
  getTutorialProgress,
} from '../src/tutorial.js';
import { getTutorialStyles, renderTutorialHint, attachTutorialHandlers } from '../src/tutorial-ui.js';

describe('createTutorialState', () => {
  it('returns object with empty completedSteps array', () => {
    const state = createTutorialState();
    assert.ok(Array.isArray(state.completedSteps));
    assert.equal(state.completedSteps.length, 0);
  });

  it('returns object with null currentHint', () => {
    const state = createTutorialState();
    assert.equal(state.currentHint, null);
  });

  it('returns object with hintsEnabled true', () => {
    const state = createTutorialState();
    assert.equal(state.hintsEnabled, true);
  });
});

describe('TUTORIAL_STEPS', () => {
  it('has at least 12 steps', () => {
    assert.ok(TUTORIAL_STEPS.length >= 12);
  });

  it('all steps have required fields', () => {
    for (const step of TUTORIAL_STEPS) {
      assert.ok(step.id);
      assert.ok(step.trigger);
      assert.ok(step.title);
      assert.ok(step.message);
      assert.ok(step.position);
    }
  });

  it('all step ids are unique', () => {
    const ids = new Set(TUTORIAL_STEPS.map((step) => step.id));
    assert.equal(ids.size, TUTORIAL_STEPS.length);
  });

  it('all positions are valid', () => {
    const valid = new Set(['top', 'bottom', 'center']);
    for (const step of TUTORIAL_STEPS) {
      assert.ok(valid.has(step.position));
    }
  });
});

describe('getTutorialHint', () => {
  it('returns matching step for a valid trigger', () => {
    const state = createTutorialState();
    const hint = getTutorialHint(state, 'first-combat');
    assert.equal(hint?.id, 'combat-intro');
  });

  it('returns null for completed trigger', () => {
    const state = createTutorialState();
    state.completedSteps.push('combat-intro');
    const hint = getTutorialHint(state, 'first-combat');
    assert.equal(hint, null);
  });

  it('returns null when hintsEnabled is false', () => {
    const state = createTutorialState();
    state.hintsEnabled = false;
    const hint = getTutorialHint(state, 'first-combat');
    assert.equal(hint, null);
  });

  it('returns null for unknown trigger', () => {
    const state = createTutorialState();
    const hint = getTutorialHint(state, 'unknown-event');
    assert.equal(hint, null);
  });
});

describe('completeTutorialStep', () => {
  it('adds stepId to completedSteps', () => {
    const state = createTutorialState();
    const next = completeTutorialStep(state, 'combat-intro');
    assert.ok(next.completedSteps.includes('combat-intro'));
  });

  it('sets currentHint to null', () => {
    const state = { ...createTutorialState(), currentHint: TUTORIAL_STEPS[0] };
    const next = completeTutorialStep(state, 'combat-intro');
    assert.equal(next.currentHint, null);
  });

  it('does not duplicate stepId if already completed', () => {
    const state = { ...createTutorialState(), completedSteps: ['combat-intro'] };
    const next = completeTutorialStep(state, 'combat-intro');
    assert.equal(next.completedSteps.length, 1);
  });

  it('preserves hintsEnabled value', () => {
    const state = { ...createTutorialState(), hintsEnabled: false };
    const next = completeTutorialStep(state, 'combat-intro');
    assert.equal(next.hintsEnabled, false);
  });
});

describe('dismissCurrentHint', () => {
  it('sets currentHint to null', () => {
    const state = { ...createTutorialState(), currentHint: TUTORIAL_STEPS[0] };
    const next = dismissCurrentHint(state);
    assert.equal(next.currentHint, null);
  });

  it('preserves completedSteps', () => {
    const state = { ...createTutorialState(), completedSteps: ['combat-intro'] };
    const next = dismissCurrentHint(state);
    assert.deepEqual(next.completedSteps, ['combat-intro']);
  });
});

describe('showHint', () => {
  it('sets currentHint to matching step', () => {
    const state = createTutorialState();
    const next = showHint(state, 'combat-intro');
    assert.equal(next.currentHint?.id, 'combat-intro');
  });

  it('returns unchanged state for unknown stepId', () => {
    const state = createTutorialState();
    const next = showHint(state, 'missing-step');
    assert.equal(next, state);
  });
});

describe('resetTutorial', () => {
  it('returns fresh state with empty completedSteps', () => {
    const next = resetTutorial();
    assert.equal(next.completedSteps.length, 0);
    assert.equal(next.currentHint, null);
  });
});

describe('getTutorialProgress', () => {
  it('returns 0% for fresh state', () => {
    const progress = getTutorialProgress(createTutorialState());
    assert.equal(progress.percentage, 0);
  });

  it('returns correct percentage after completing steps', () => {
    const state = createTutorialState();
    state.completedSteps = ['welcome', 'combat-intro', 'quest-intro'];
    const progress = getTutorialProgress(state);
    assert.equal(progress.completed, 3);
    assert.equal(progress.percentage, Math.round((3 / TUTORIAL_STEPS.length) * 100));
  });

  it('returns 100% when all steps completed', () => {
    const state = createTutorialState();
    state.completedSteps = TUTORIAL_STEPS.map((step) => step.id);
    const progress = getTutorialProgress(state);
    assert.equal(progress.percentage, 100);
  });
});



describe('getTutorialStyles', () => {
  it('keeps overlay non-blocking while tooltip remains interactive', () => {
    const css = getTutorialStyles();
    assert.ok(css.includes('.tutorial-overlay'));
    assert.ok(css.includes('pointer-events: none;'));
    assert.ok(css.includes('.tutorial-tooltip'));
    assert.ok(css.includes('pointer-events: auto;'));
  });
});
describe('renderTutorialHint', () => {
  it('returns empty string when state is null', () => {
    assert.equal(renderTutorialHint(null), '');
  });

  it('returns empty string when currentHint is null', () => {
    const state = createTutorialState();
    assert.equal(renderTutorialHint(state), '');
  });

  it('returns HTML with tutorial-overlay class when hint active', () => {
    const state = { ...createTutorialState(), currentHint: TUTORIAL_STEPS[0] };
    const html = renderTutorialHint(state);
    assert.ok(html.includes('tutorial-overlay'));
  });

  it('includes title and message text in output', () => {
    const step = TUTORIAL_STEPS[0];
    const state = { ...createTutorialState(), currentHint: step };
    const html = renderTutorialHint(state);
    assert.ok(html.includes(step.title));
    assert.ok(html.includes(step.message));
  });

  it('includes position class in tooltip', () => {
    const step = TUTORIAL_STEPS.find((entry) => entry.position === 'top');
    const state = { ...createTutorialState(), currentHint: step };
    const html = renderTutorialHint(state);
    assert.ok(html.includes(`position-${step.position}`));
  });
});

describe('attachTutorialHandlers', () => {
  let originalDocument;

  beforeEach(() => {
    originalDocument = global.document;
    global.document = {
      getElementById: () => null,
    };
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it('does not throw when elements not found', () => {
    assert.doesNotThrow(() => attachTutorialHandlers(() => {}));
  });
});
