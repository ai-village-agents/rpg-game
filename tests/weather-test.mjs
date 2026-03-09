import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TIME_OF_DAY,
  WEATHER_TYPES,
  TIME_ICONS,
  WEATHER_ICONS,
  TIME_CYCLE_LENGTH,
  WEATHER_POOL,
  createWeatherState,
  advanceTime,
  tryChangeWeather,
  getEncounterRateModifier,
  getCombatStatModifiers,
  getWeatherDescription,
  getWeatherBanner,
  hasWeatherSystem,
} from '../src/weather.js';
import {
  renderWeatherBar,
  renderWeatherTooltip,
  getWeatherBarCSS,
} from '../src/weather-ui.js';

describe('weather system', () => {
  it('createWeatherState returns correct initial state', () => {
    assert.deepEqual(createWeatherState(), {
      timeOfDay: 'morning',
      weather: 'clear',
      movesInCurrentTime: 0,
      totalMoves: 0,
    });
  });

  it('advanceTime increments movesInCurrentTime for first 7 moves', () => {
    let state = createWeatherState();
    for (let i = 1; i < TIME_CYCLE_LENGTH; i += 1) {
      state = advanceTime(state);
      assert.equal(state.movesInCurrentTime, i);
      assert.equal(state.timeOfDay, TIME_OF_DAY.MORNING);
    }
  });

  it('advanceTime transitions from morning to afternoon after cycle length', () => {
    let state = createWeatherState();
    for (let i = 0; i < TIME_CYCLE_LENGTH; i += 1) {
      state = advanceTime(state);
    }
    assert.equal(state.timeOfDay, TIME_OF_DAY.AFTERNOON);
    assert.equal(state.movesInCurrentTime, 0);
  });

  it('advanceTime cycles through all time periods back to morning', () => {
    let state = createWeatherState();
    for (let i = 0; i < TIME_CYCLE_LENGTH * 4; i += 1) {
      state = advanceTime(state);
    }
    assert.equal(state.timeOfDay, TIME_OF_DAY.MORNING);
  });

  it('advanceTime increments totalMoves', () => {
    let state = createWeatherState();
    state = advanceTime(state);
    state = advanceTime(state);
    assert.equal(state.totalMoves, 2);
  });

  it('tryChangeWeather does not change when seed condition fails', () => {
    const state = createWeatherState();
    const next = tryChangeWeather(state, 50);
    assert.equal(next.weather, state.weather);
  });

  it('tryChangeWeather changes using the weather pool when seed condition passes', () => {
    const state = createWeatherState();
    const seed = 201;
    const next = tryChangeWeather(state, seed);
    const expected = WEATHER_POOL[Math.abs(seed) % WEATHER_POOL.length];
    assert.equal(next.weather, expected);
  });

  it('getEncounterRateModifier returns 0.6 for foggy afternoon', () => {
    const state = { timeOfDay: TIME_OF_DAY.AFTERNOON, weather: WEATHER_TYPES.FOGGY };
    assert.equal(getEncounterRateModifier(state), 0.6);
  });

  it('getEncounterRateModifier returns 2.1 for stormy night', () => {
    const state = { timeOfDay: TIME_OF_DAY.NIGHT, weather: WEATHER_TYPES.STORMY };
    const result = getEncounterRateModifier(state);
    assert.ok(Math.abs(result - 2.1) < 0.001, `Expected ~2.1 but got ${result}`);
  });

  it('getCombatStatModifiers returns rain penalty for fire-spirit', () => {
    const state = { timeOfDay: TIME_OF_DAY.AFTERNOON, weather: WEATHER_TYPES.RAINY };
    const mods = getCombatStatModifiers(state, 'fire-spirit');
    assert.equal(mods.atkModifier, 0.75);
    assert.equal(mods.defModifier, 0.8);
  });

  it('getCombatStatModifiers returns storm bonus for thunder-hawk', () => {
    const state = { timeOfDay: TIME_OF_DAY.AFTERNOON, weather: WEATHER_TYPES.STORMY };
    const mods = getCombatStatModifiers(state, 'thunder-hawk');
    assert.equal(mods.atkModifier, 1.35);
    assert.equal(mods.spdModifier, 1.25);
  });

  it('getCombatStatModifiers returns defaults for slime in clear afternoon', () => {
    const state = { timeOfDay: TIME_OF_DAY.AFTERNOON, weather: WEATHER_TYPES.CLEAR };
    const mods = getCombatStatModifiers(state, 'slime');
    assert.deepEqual(mods, { atkModifier: 1, defModifier: 1, spdModifier: 1 });
  });

  it('getWeatherDescription returns a non-empty string', () => {
    const text = getWeatherDescription(createWeatherState());
    assert.equal(typeof text, 'string');
    assert.ok(text.length > 0);
  });

  it('getWeatherBanner includes time and weather icons', () => {
    const state = createWeatherState();
    const banner = getWeatherBanner(state);
    assert.ok(banner.includes(TIME_ICONS[state.timeOfDay]));
    assert.ok(banner.includes(WEATHER_ICONS[state.weather]));
  });

  it('hasWeatherSystem returns true when weatherState exists', () => {
    const state = { weatherState: createWeatherState() };
    assert.equal(hasWeatherSystem(state), true);
  });

  it('hasWeatherSystem returns false when weatherState missing', () => {
    assert.equal(hasWeatherSystem({}), false);
  });

  it('renderWeatherBar returns a weather bar with icons and labels', () => {
    const state = createWeatherState();
    const html = renderWeatherBar(state);
    assert.ok(html.includes('weather-bar'));
    assert.ok(html.includes(TIME_ICONS[state.timeOfDay]));
    assert.ok(html.includes(WEATHER_ICONS[state.weather]));
  });

  it('renderWeatherTooltip includes encounter modifier and description', () => {
    const state = createWeatherState();
    const html = renderWeatherTooltip(state);
    assert.ok(html.includes('Encounter rate:'));
    assert.ok(html.includes(getWeatherDescription(state)));
  });

  it('getWeatherBarCSS returns dark themed styles', () => {
    const css = getWeatherBarCSS();
    assert.ok(css.includes('.weather-bar'));
    assert.ok(css.includes('#1b1f2a'));
  });
});
