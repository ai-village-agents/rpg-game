import test from 'node:test';
import assert from 'node:assert/strict';

import { renderTalentTree } from '../src/talents-ui.js';
import { createTalentState } from '../src/talents.js';
import { TALENTS } from '../src/data/talents.js';

// Helper to get a concrete talent id for assertions
function getSampleTalentId() {
  const all = Object.keys(TALENTS);
  if (all.length === 0) {
    throw new Error('No talents defined in TALENTS');
  }
  return all[0];
}

function createStateWithTalents() {
  const talentState = createTalentState();
  // Give the player some available points so the UI shows the main tree
  talentState.availablePoints = 3;
  return {
    player: {
      name: 'Tester',
      level: 1,
      classId: 'warrior',
      talents: talentState,
    },
  };
}

// Contract: when talent state is present on player.talents, the UI
// should render the full tree (with Available Points) rather than the
// "Talents not available yet" placeholder.

test('talents-ui-contract: renders tree when player.talents is present', () => {
  const state = createStateWithTalents();
  const html = renderTalentTree(state);

  assert.ok(html.includes('⭐ Talent Tree'), 'should include talent tree header');
  assert.ok(html.includes('Available Points'), 'should show available points when talent state exists');
  assert.ok(!html.includes('Talents not available yet.'), 'should not show placeholder when talent state exists');
});

// Contract: talent buttons must expose data-action and data-talent
// attributes so render.js / attachTalentHandlers can dispatch
// ALLOCATE_TALENT / DEALLOCATE_TALENT with a concrete talentId.

test('talents-ui-contract: talent nodes expose data-action and data-talent attributes', () => {
  const state = createStateWithTalents();
  const html = renderTalentTree(state);

  const sampleId = getSampleTalentId();

  // Simple, explicit check instead of a complex regex with flags
  const allocateSnippet = `data-action="ALLOCATE_TALENT"`;
  const talentSnippet = `data-talent="${sampleId}"`;

  assert.ok(html.includes('data-action="ALLOCATE_TALENT"'), 'rendered HTML should contain an ALLOCATE_TALENT button');
  assert.ok(html.includes('data-talent="'), 'rendered HTML should contain at least one data-talent attribute');

  // Best-effort stronger check: there should be at least one place where
  // the specific sample talent id appears in a data-talent attribute.
  assert.ok(
    html.includes(talentSnippet),
    `rendered HTML should contain data-talent for sample talent id ${sampleId}`,
  );
});

