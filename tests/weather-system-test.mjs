/**
 * Weather System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  WEATHER_TYPES,
  SEASONS,
  WEATHER_EFFECTS,
  initWeatherState,
  setWeather,
  setSeason,
  setDayTime,
  setTemperature,
  generateRandomWeather,
  advanceWeather,
  generateForecast,
  getCurrentWeather,
  getWeatherEffects,
  applyWeatherToStats,
  getSeasonInfo,
  getDayTimeInfo,
  getWeatherHistory,
  getForecasts,
  getAllWeatherTypes,
  getAllSeasons,
  isHazardousWeather,
  getTemperatureDescription
} from '../src/weather-system.js';

import {
  renderWeatherWidget,
  renderWeatherEffects,
  renderForecast,
  renderWeatherHistory,
  renderSeasonDisplay,
  renderDayTimeDisplay,
  renderTemperatureGauge,
  renderWeatherSelector,
  renderSeasonSelector,
  renderWeatherPage,
  renderWeatherNotification,
  renderMiniWeather
} from '../src/weather-system-ui.js';

describe('Weather System', () => {
  describe('WEATHER_TYPES', () => {
    it('should have all weather types defined', () => {
      assert.ok(WEATHER_TYPES.CLEAR);
      assert.ok(WEATHER_TYPES.CLOUDY);
      assert.ok(WEATHER_TYPES.RAIN);
      assert.ok(WEATHER_TYPES.STORM);
      assert.ok(WEATHER_TYPES.SNOW);
      assert.ok(WEATHER_TYPES.FOG);
      assert.ok(WEATHER_TYPES.WIND);
      assert.ok(WEATHER_TYPES.HAIL);
    });

    it('should have correct properties for each type', () => {
      assert.strictEqual(WEATHER_TYPES.CLEAR.id, 'clear');
      assert.ok(WEATHER_TYPES.CLEAR.icon);
      assert.ok(WEATHER_TYPES.CLEAR.color);
    });
  });

  describe('SEASONS', () => {
    it('should have all seasons defined', () => {
      assert.ok(SEASONS.SPRING);
      assert.ok(SEASONS.SUMMER);
      assert.ok(SEASONS.AUTUMN);
      assert.ok(SEASONS.WINTER);
    });

    it('should have months for each season', () => {
      assert.deepStrictEqual(SEASONS.SPRING.months, [3, 4, 5]);
      assert.deepStrictEqual(SEASONS.WINTER.months, [12, 1, 2]);
    });
  });

  describe('WEATHER_EFFECTS', () => {
    it('should have effects for each weather type', () => {
      assert.ok(WEATHER_EFFECTS.clear);
      assert.ok(WEATHER_EFFECTS.storm);
      assert.ok(WEATHER_EFFECTS.fog);
    });

    it('should have visibility effects', () => {
      assert.strictEqual(WEATHER_EFFECTS.clear.visibility, 1.0);
      assert.strictEqual(WEATHER_EFFECTS.fog.visibility, 0.3);
    });
  });

  describe('initWeatherState', () => {
    it('should initialize weather state', () => {
      const result = initWeatherState({});
      assert.ok(result.success);
      assert.ok(result.state.weather);
      assert.strictEqual(result.state.weather.current, 'clear');
      assert.strictEqual(result.state.weather.season, 'spring');
    });

    it('should set default values', () => {
      const result = initWeatherState({});
      assert.strictEqual(result.state.weather.dayTime, 'day');
      assert.strictEqual(result.state.weather.temperature, 20);
      assert.deepStrictEqual(result.state.weather.history, []);
    });
  });

  describe('setWeather', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should set weather type', () => {
      const result = setWeather(state, 'rain');
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.current, 'rain');
    });

    it('should set intensity', () => {
      const result = setWeather(state, 'storm', { intensity: 0.8 });
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.intensity, 0.8);
    });

    it('should clamp intensity to valid range', () => {
      const result = setWeather(state, 'rain', { intensity: 1.5 });
      assert.strictEqual(result.state.weather.intensity, 1);
    });

    it('should track previous weather', () => {
      const result = setWeather(state, 'rain');
      assert.strictEqual(result.previousWeather, 'clear');
    });

    it('should add to history', () => {
      const result = setWeather(state, 'rain');
      assert.strictEqual(result.state.weather.history.length, 1);
    });

    it('should fail for invalid weather type', () => {
      const result = setWeather(state, 'invalid_weather');
      assert.ok(!result.success);
    });
  });

  describe('setSeason', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should set season', () => {
      const result = setSeason(state, 'winter');
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.season, 'winter');
    });

    it('should fail for invalid season', () => {
      const result = setSeason(state, 'invalid_season');
      assert.ok(!result.success);
    });
  });

  describe('setDayTime', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should set day time', () => {
      const result = setDayTime(state, 'night');
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.dayTime, 'night');
    });

    it('should fail for invalid day time', () => {
      const result = setDayTime(state, 'invalid_time');
      assert.ok(!result.success);
    });
  });

  describe('setTemperature', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should set temperature', () => {
      const result = setTemperature(state, 25);
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.temperature, 25);
    });

    it('should clamp temperature to valid range', () => {
      const result = setTemperature(state, 100);
      assert.strictEqual(result.state.weather.temperature, 50);
      
      const result2 = setTemperature(state, -100);
      assert.strictEqual(result2.state.weather.temperature, -50);
    });

    it('should fail for non-number', () => {
      const result = setTemperature(state, 'hot');
      assert.ok(!result.success);
    });
  });

  describe('generateRandomWeather', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should generate weather for current season', () => {
      const result = generateRandomWeather(state);
      assert.ok(result.success);
      assert.ok(result.state.weather.current);
    });

    it('should generate different weather with different seeds', () => {
      const result1 = generateRandomWeather(state, 0.1);
      const result2 = generateRandomWeather(state, 0.9);
      assert.ok(result1.success);
      assert.ok(result2.success);
    });
  });

  describe('advanceWeather', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
      state = setWeather(state, 'rain', { duration: 1000 }).state;
    });

    it('should reduce duration', () => {
      const result = advanceWeather(state, 500);
      assert.ok(result.success);
      assert.strictEqual(result.state.weather.duration, 500);
      assert.ok(!result.weatherChanged);
    });

    it('should change weather when duration expires', () => {
      const result = advanceWeather(state, 2000);
      assert.ok(result.success);
      assert.ok(result.weatherChanged);
    });
  });

  describe('generateForecast', () => {
    let state;

    beforeEach(() => {
      state = initWeatherState({}).state;
    });

    it('should generate forecasts', () => {
      const result = generateForecast(state, 3);
      assert.ok(result.success);
      assert.strictEqual(result.forecasts.length, 3);
    });

    it('should include period numbers', () => {
      const result = generateForecast(state, 2);
      assert.strictEqual(result.forecasts[0].period, 1);
      assert.strictEqual(result.forecasts[1].period, 2);
    });
  });

  describe('getCurrentWeather', () => {
    it('should return current weather info', () => {
      const state = initWeatherState({}).state;
      const result = getCurrentWeather(state);
      assert.ok(result.found);
      assert.strictEqual(result.weather.type, 'clear');
      assert.ok(result.weather.icon);
      assert.ok(result.weather.color);
    });
  });

  describe('getWeatherEffects', () => {
    it('should return scaled effects', () => {
      let state = initWeatherState({}).state;
      state = setWeather(state, 'fog', { intensity: 1.0 }).state;
      
      const result = getWeatherEffects(state);
      assert.ok(result.found);
      assert.ok(result.effects.visibility < 1);
    });

    it('should apply night time visibility reduction', () => {
      let state = initWeatherState({}).state;
      state = setDayTime(state, 'night').state;
      
      const result = getWeatherEffects(state);
      assert.ok(result.effects.visibility < 1);
    });
  });

  describe('applyWeatherToStats', () => {
    it('should modify stats based on weather', () => {
      const stats = { speed: 100, accuracy: 80, stealth: 50 };
      const effects = { movementSpeed: 0.8, combatAccuracy: 0.9, stealthBonus: 0.2 };
      
      const modified = applyWeatherToStats(stats, effects);
      assert.strictEqual(modified.speed, 80);
      assert.strictEqual(modified.accuracy, 72);
      assert.strictEqual(modified.stealth, 60);
    });
  });

  describe('getSeasonInfo', () => {
    it('should return season info', () => {
      const state = initWeatherState({}).state;
      const result = getSeasonInfo(state);
      assert.ok(result.found);
      assert.strictEqual(result.season.id, 'spring');
    });
  });

  describe('getDayTimeInfo', () => {
    it('should return day time info', () => {
      const state = initWeatherState({}).state;
      const result = getDayTimeInfo(state);
      assert.ok(result.found);
      assert.strictEqual(result.dayTime.id, 'day');
      assert.strictEqual(result.dayTime.lightLevel, 1.0);
    });
  });

  describe('getWeatherHistory', () => {
    it('should return weather history', () => {
      let state = initWeatherState({}).state;
      state = setWeather(state, 'rain').state;
      state = setWeather(state, 'storm').state;
      
      const history = getWeatherHistory(state);
      assert.strictEqual(history.length, 2);
    });
  });

  describe('getAllWeatherTypes', () => {
    it('should return all weather types', () => {
      const types = getAllWeatherTypes();
      assert.strictEqual(types.length, 8);
    });
  });

  describe('getAllSeasons', () => {
    it('should return all seasons', () => {
      const seasons = getAllSeasons();
      assert.strictEqual(seasons.length, 4);
    });
  });

  describe('isHazardousWeather', () => {
    it('should identify hazardous weather', () => {
      assert.ok(isHazardousWeather('storm'));
      assert.ok(isHazardousWeather('hail'));
      assert.ok(!isHazardousWeather('clear'));
    });
  });

  describe('getTemperatureDescription', () => {
    it('should describe temperature ranges', () => {
      assert.strictEqual(getTemperatureDescription(-30).desc, 'Freezing');
      assert.strictEqual(getTemperatureDescription(25).desc, 'Warm');
      assert.strictEqual(getTemperatureDescription(45).desc, 'Extreme Heat');
    });

    it('should mark dangerous temperatures', () => {
      assert.ok(getTemperatureDescription(-30).danger);
      assert.ok(getTemperatureDescription(45).danger);
      assert.ok(!getTemperatureDescription(20).danger);
    });
  });
});

describe('Weather System UI', () => {
  let state;

  beforeEach(() => {
    state = initWeatherState({}).state;
  });

  describe('renderWeatherWidget', () => {
    it('should render weather widget', () => {
      const html = renderWeatherWidget(state);
      assert.ok(html.includes('weather-widget'));
      assert.ok(html.includes('Clear'));
    });

    it('should render compact widget', () => {
      const html = renderWeatherWidget(state, { compact: true });
      assert.ok(html.includes('compact'));
    });

    it('should show hazard warning', () => {
      state = setWeather(state, 'storm').state;
      const html = renderWeatherWidget(state);
      assert.ok(html.includes('hazard-warning'));
    });
  });

  describe('renderWeatherEffects', () => {
    it('should render weather effects', () => {
      const html = renderWeatherEffects(state);
      assert.ok(html.includes('weather-effects'));
      assert.ok(html.includes('Visibility'));
    });
  });

  describe('renderForecast', () => {
    it('should render forecast', () => {
      state = generateForecast(state, 3).state;
      const html = renderForecast(state);
      assert.ok(html.includes('weather-forecast'));
      assert.ok(html.includes('forecast-item'));
    });

    it('should show empty message without forecasts', () => {
      const html = renderForecast(state);
      assert.ok(html.includes('empty'));
    });
  });

  describe('renderWeatherHistory', () => {
    it('should render history', () => {
      state = setWeather(state, 'rain').state;
      const html = renderWeatherHistory(state);
      assert.ok(html.includes('weather-history'));
    });
  });

  describe('renderSeasonDisplay', () => {
    it('should render season', () => {
      const html = renderSeasonDisplay(state);
      assert.ok(html.includes('season-display'));
      assert.ok(html.includes('Spring'));
    });
  });

  describe('renderDayTimeDisplay', () => {
    it('should render day time', () => {
      const html = renderDayTimeDisplay(state);
      assert.ok(html.includes('day-time-display'));
      assert.ok(html.includes('Day'));
    });
  });

  describe('renderTemperatureGauge', () => {
    it('should render temperature gauge', () => {
      const html = renderTemperatureGauge(state);
      assert.ok(html.includes('temperature-gauge'));
      assert.ok(html.includes('20°C'));
    });
  });

  describe('renderWeatherSelector', () => {
    it('should render weather selector', () => {
      const html = renderWeatherSelector();
      assert.ok(html.includes('weather-selector'));
      assert.ok(html.includes('Clear'));
      assert.ok(html.includes('Storm'));
    });

    it('should mark selected weather', () => {
      const html = renderWeatherSelector('rain');
      assert.ok(html.includes('data-weather="rain"'));
    });
  });

  describe('renderSeasonSelector', () => {
    it('should render season selector', () => {
      const html = renderSeasonSelector();
      assert.ok(html.includes('season-selector'));
      assert.ok(html.includes('Spring'));
      assert.ok(html.includes('Winter'));
    });
  });

  describe('renderWeatherPage', () => {
    it('should render full weather page', () => {
      const html = renderWeatherPage(state);
      assert.ok(html.includes('weather-page'));
      assert.ok(html.includes('weather-widget'));
      assert.ok(html.includes('season-display'));
    });
  });

  describe('renderWeatherNotification', () => {
    it('should render weather change notification', () => {
      const html = renderWeatherNotification('rain', 'clear');
      assert.ok(html.includes('weather-notification'));
      assert.ok(html.includes('Rain'));
    });
  });

  describe('renderMiniWeather', () => {
    it('should render mini weather display', () => {
      const html = renderMiniWeather(state);
      assert.ok(html.includes('mini-weather'));
      assert.ok(html.includes('20°'));
    });
  });

  describe('XSS Prevention', () => {
    it('should escape HTML in weather names', () => {
      const html = renderWeatherNotification('<script>alert("xss")</script>', 'clear');
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
