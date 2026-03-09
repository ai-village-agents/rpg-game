import test from 'node:test';
import { deepStrictEqual, strictEqual } from 'node:assert';
import {
  getCompanionMood,
  getMoodChange,
  getMoodDisplayText,
  getAllCompanionMoods,
  createMoodNotification,
  MOOD_STATES,
} from '../src/companion-mood.js';

test('Companion Mood Indicators - getCompanionMood - should return ABANDONED mood for loyalty 0', () => {
  const mood = getCompanionMood(0);
  deepStrictEqual(mood, MOOD_STATES.ABANDONED);
  strictEqual(mood.emoji, '💔');
});

test('Companion Mood Indicators - getCompanionMood - should return DISCONTENT mood for loyalty 10', () => {
  const mood = getCompanionMood(10);
  deepStrictEqual(mood, MOOD_STATES.DISCONTENT);
  strictEqual(mood.emoji, '😠');
});

test('Companion Mood Indicators - getCompanionMood - should return NEUTRAL mood for loyalty 25', () => {
  const mood = getCompanionMood(25);
  deepStrictEqual(mood, MOOD_STATES.NEUTRAL);
  strictEqual(mood.emoji, '😐');
});

test('Companion Mood Indicators - getCompanionMood - should return FRIENDLY mood for loyalty 50', () => {
  const mood = getCompanionMood(50);
  deepStrictEqual(mood, MOOD_STATES.FRIENDLY);
  strictEqual(mood.emoji, '😊');
});

test('Companion Mood Indicators - getCompanionMood - should return DEVOTED mood for loyalty 75', () => {
  const mood = getCompanionMood(75);
  deepStrictEqual(mood, MOOD_STATES.DEVOTED);
  strictEqual(mood.emoji, '😄');
});

test('Companion Mood Indicators - getCompanionMood - should return SOULBOUND mood for loyalty 100', () => {
  const mood = getCompanionMood(100);
  deepStrictEqual(mood, MOOD_STATES.SOULBOUND);
  strictEqual(mood.emoji, '💖');
});

test('Companion Mood Indicators - getCompanionMood - should handle edge case loyalty 99 as DEVOTED', () => {
  const mood = getCompanionMood(99);
  strictEqual(mood.emoji, '😄');
});

test('Companion Mood Indicators - getCompanionMood - should handle edge case loyalty 51 as FRIENDLY', () => {
  const mood = getCompanionMood(51);
  strictEqual(mood.emoji, '😊');
});

test('Companion Mood Indicators - getMoodChange - should detect mood improvement from NEUTRAL to FRIENDLY', () => {
  const change = getMoodChange(25, 50);
  strictEqual(change, 'improved');
});

test('Companion Mood Indicators - getMoodChange - should detect mood decline from FRIENDLY to NEUTRAL', () => {
  const change = getMoodChange(50, 25);
  strictEqual(change, 'declined');
});

test('Companion Mood Indicators - getMoodChange - should detect stable mood within same tier', () => {
  const change = getMoodChange(50, 60);
  strictEqual(change, 'stable');
});

test('Companion Mood Indicators - getMoodChange - should detect improvement from DISCONTENT to NEUTRAL', () => {
  const change = getMoodChange(10, 25);
  strictEqual(change, 'improved');
});

test('Companion Mood Indicators - getMoodChange - should detect decline from SOULBOUND to DEVOTED', () => {
  const change = getMoodChange(100, 75);
  strictEqual(change, 'declined');
});

test('Companion Mood Indicators - getMoodChange - should detect stable mood at same value', () => {
  const change = getMoodChange(50, 50);
  strictEqual(change, 'stable');
});

test('Companion Mood Indicators - getMoodDisplayText - should format improvement text', () => {
  const mood = getCompanionMood(50);
  const text = getMoodDisplayText('Fenris', mood, 'improved');
  strictEqual(text.includes('Fenris'), true);
  strictEqual(text.includes('happy'), true);
  strictEqual(text.includes('😊'), true);
});

test('Companion Mood Indicators - getMoodDisplayText - should format decline text', () => {
  const mood = getCompanionMood(25);
  const text = getMoodDisplayText('Lyra', mood, 'declined');
  strictEqual(text.includes('Lyra'), true);
  strictEqual(text.includes('neutral'), true);
  strictEqual(text.includes('😐'), true);
});

test('Companion Mood Indicators - getMoodDisplayText - should format stable text', () => {
  const mood = getCompanionMood(75);
  const text = getMoodDisplayText('Companion', mood, 'stable');
  strictEqual(text.includes('Companion'), true);
  strictEqual(text.includes('devoted'), true);
  strictEqual(text.includes('😄'), true);
});

test('Companion Mood Indicators - getAllCompanionMoods - should return empty object for no companions', () => {
  const state = { companions: [] };
  const moods = getAllCompanionMoods(state);
  deepStrictEqual(moods, {});
});

test('Companion Mood Indicators - getAllCompanionMoods - should return mood data for all companions', () => {
  const state = {
    companions: [
      { id: 'fenris', name: 'Fenris', loyalty: 50, soulbound: false },
      { id: 'lyra', name: 'Lyra', loyalty: 75, soulbound: false },
    ],
  };
  const moods = getAllCompanionMoods(state);
  deepStrictEqual(Object.keys(moods).sort(), ['fenris', 'lyra']);
  strictEqual(moods.fenris.mood.emoji, '😊');
  strictEqual(moods.lyra.mood.emoji, '😄');
});

test('Companion Mood Indicators - getAllCompanionMoods - should handle missing loyalty as 0', () => {
  const state = {
    companions: [{ id: 'unknown', name: 'Unknown' }],
  };
  const moods = getAllCompanionMoods(state);
  strictEqual(moods.unknown.mood.emoji, '💔');
});

test('Companion Mood Indicators - getAllCompanionMoods - should track soulbound status', () => {
  const state = {
    companions: [
      { id: 'bonded', name: 'Bonded', loyalty: 100, soulbound: true },
    ],
  };
  const moods = getAllCompanionMoods(state);
  strictEqual(moods.bonded.soulbound, true);
});

test('Companion Mood Indicators - createMoodNotification - should create improvement notification', () => {
  const text = createMoodNotification('Fenris', 25, 50);
  strictEqual(text.includes('Fenris'), true);
  strictEqual(text.includes('improved'), true);
  strictEqual(text.includes('😐'), true);
  strictEqual(text.includes('😊'), true);
});

test('Companion Mood Indicators - createMoodNotification - should create decline notification', () => {
  const text = createMoodNotification('Lyra', 75, 50);
  strictEqual(text.includes('Lyra'), true);
  strictEqual(text.includes('declined'), true);
  strictEqual(text.includes('😄'), true);
  strictEqual(text.includes('😊'), true);
});

test('Companion Mood Indicators - createMoodNotification - should create stable notification', () => {
  const text = createMoodNotification('Companion', 50, 60);
  strictEqual(text.includes('Companion'), true);
  strictEqual(text.includes('😊'), true);
  strictEqual(text.includes('Happy'), true);
});

test('Companion Mood Indicators - createMoodNotification - should handle soulbound notification', () => {
  const text = createMoodNotification('Bonded', 75, 100);
  strictEqual(text.includes('Bonded'), true);
  strictEqual(text.includes('improved'), true);
  strictEqual(text.includes('💖'), true);
});

test('Companion Mood Indicators - createMoodNotification - should handle abandoned notification', () => {
  const text = createMoodNotification('Sad', 10, 0);
  strictEqual(text.includes('Sad'), true);
  strictEqual(text.includes('declined'), true);
  strictEqual(text.includes('💔'), true);
});

test('Companion Mood Indicators - MOOD_STATES constants - should have all required mood states', () => {
  const requiredMoods = [
    'ABANDONED',
    'DISCONTENT',
    'NEUTRAL',
    'FRIENDLY',
    'DEVOTED',
    'SOULBOUND',
  ];
  for (const mood of requiredMoods) {
    strictEqual(Object.prototype.hasOwnProperty.call(MOOD_STATES, mood), true);
  }
});

test('Companion Mood Indicators - MOOD_STATES constants - should have proper structure for each mood', () => {
  for (const mood of Object.values(MOOD_STATES)) {
    strictEqual(Object.prototype.hasOwnProperty.call(mood, 'tier'), true);
    strictEqual(Object.prototype.hasOwnProperty.call(mood, 'emoji'), true);
    strictEqual(Object.prototype.hasOwnProperty.call(mood, 'label'), true);
    strictEqual(Object.prototype.hasOwnProperty.call(mood, 'description'), true);
    strictEqual(Object.prototype.hasOwnProperty.call(mood, 'color'), true);
    strictEqual(typeof mood.emoji, 'string');
    strictEqual(/^#[0-9A-Fa-f]{6}$/.test(mood.color), true);
  }
});
