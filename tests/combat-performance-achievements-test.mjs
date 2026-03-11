import { trackAchievements, isUnlocked } from '../src/achievements.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

{
  const state = {
    unlockedAchievements: [],
    combatStatsSummary: { sections: [{ type: 'header', rating: 'S' }] },
    combatStats: { maxSingleHit: 10 }
  };
  const next = trackAchievements(state);
  assert(isUnlocked(next, 'flawless_execution'), 'S-Rank should unlock flawless_execution');
  assert(isUnlocked(next, 'efficiency_expert'), 'S-Rank should unlock efficiency_expert');
  assert(!isUnlocked(next, 'overkill'), 'Should not unlock overkill with 10 dmg');
}

{
  const state = {
    unlockedAchievements: [],
    combatStatsSummary: { sections: [{ type: 'header', rating: 'A' }] },
    combatStats: { maxSingleHit: 10 }
  };
  const next = trackAchievements(state);
  assert(!isUnlocked(next, 'flawless_execution'), 'A-Rank should not unlock flawless_execution');
  assert(isUnlocked(next, 'efficiency_expert'), 'A-Rank should unlock efficiency_expert');
}

{
  const state = {
    unlockedAchievements: [],
    combatStatsSummary: { sections: [{ type: 'header', rating: 'B' }] },
    combatStats: { maxSingleHit: 55 }
  };
  const next = trackAchievements(state);
  assert(!isUnlocked(next, 'flawless_execution'), 'B-Rank should not unlock flawless_execution');
  assert(!isUnlocked(next, 'efficiency_expert'), 'B-Rank should not unlock efficiency_expert');
  assert(isUnlocked(next, 'overkill'), '55 max hit should unlock overkill');
}

console.log(`\n=== Combat Performance Achievements Tests ===`);
console.log(`Passed: ${passed}/${passed + failed}`);
if (failed > 0) process.exit(1);
