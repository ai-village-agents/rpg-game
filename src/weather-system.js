/**
 * Weather System - Dynamic weather effects for the RPG
 */

export const WEATHER_TYPES = {
  CLEAR: { id: 'clear', name: 'Clear', icon: '☀️', color: '#ffd700' },
  CLOUDY: { id: 'cloudy', name: 'Cloudy', icon: '☁️', color: '#9e9e9e' },
  RAIN: { id: 'rain', name: 'Rain', icon: '🌧️', color: '#42a5f5' },
  STORM: { id: 'storm', name: 'Storm', icon: '⛈️', color: '#5c6bc0' },
  SNOW: { id: 'snow', name: 'Snow', icon: '❄️', color: '#e3f2fd' },
  FOG: { id: 'fog', name: 'Fog', icon: '🌫️', color: '#b0bec5' },
  WIND: { id: 'wind', name: 'Windy', icon: '💨', color: '#80cbc4' },
  HAIL: { id: 'hail', name: 'Hail', icon: '🌨️', color: '#b3e5fc' }
};

export const SEASONS = {
  SPRING: { id: 'spring', name: 'Spring', icon: '🌸', months: [3, 4, 5] },
  SUMMER: { id: 'summer', name: 'Summer', icon: '🌻', months: [6, 7, 8] },
  AUTUMN: { id: 'autumn', name: 'Autumn', icon: '🍂', months: [9, 10, 11] },
  WINTER: { id: 'winter', name: 'Winter', icon: '❄️', months: [12, 1, 2] }
};

export const WEATHER_EFFECTS = {
  clear: { visibility: 1.0, movementSpeed: 1.0, combatAccuracy: 1.0, fireResist: -0.1 },
  cloudy: { visibility: 0.9, movementSpeed: 1.0, combatAccuracy: 0.95, fireResist: 0 },
  rain: { visibility: 0.7, movementSpeed: 0.9, combatAccuracy: 0.85, fireResist: 0.2 },
  storm: { visibility: 0.5, movementSpeed: 0.7, combatAccuracy: 0.7, fireResist: 0.3, lightningChance: 0.05 },
  snow: { visibility: 0.6, movementSpeed: 0.75, combatAccuracy: 0.8, coldDamage: 0.1 },
  fog: { visibility: 0.3, movementSpeed: 0.85, combatAccuracy: 0.6, stealthBonus: 0.2 },
  wind: { visibility: 0.95, movementSpeed: 0.85, combatAccuracy: 0.9, rangedPenalty: 0.15 },
  hail: { visibility: 0.6, movementSpeed: 0.7, combatAccuracy: 0.75, periodicDamage: 0.05 }
};

const SEASON_WEATHER_CHANCES = {
  spring: { clear: 0.3, cloudy: 0.25, rain: 0.3, storm: 0.1, fog: 0.05 },
  summer: { clear: 0.5, cloudy: 0.2, rain: 0.15, storm: 0.1, wind: 0.05 },
  autumn: { clear: 0.2, cloudy: 0.3, rain: 0.25, fog: 0.15, wind: 0.1 },
  winter: { clear: 0.15, cloudy: 0.25, snow: 0.35, hail: 0.1, fog: 0.1, storm: 0.05 }
};

export function initWeatherState(state) {
  return {
    state: {
      ...state,
      weather: {
        current: 'clear',
        intensity: 0.5,
        duration: 0,
        season: 'spring',
        dayTime: 'day',
        temperature: 20,
        history: [],
        forecasts: []
      }
    },
    success: true
  };
}

export function setWeather(state, weatherType, options = {}) {
  const { intensity = 0.5, duration = 3600000 } = options;
  
  const type = WEATHER_TYPES[weatherType.toUpperCase()];
  if (!type) {
    return { success: false, error: 'Invalid weather type' };
  }
  
  const previous = state.weather.current;
  const historyEntry = {
    weather: previous,
    endedAt: Date.now(),
    duration: state.weather.duration
  };
  
  return {
    success: true,
    state: {
      ...state,
      weather: {
        ...state.weather,
        current: type.id,
        intensity: Math.max(0, Math.min(1, intensity)),
        duration,
        startedAt: Date.now(),
        history: [...state.weather.history.slice(-9), historyEntry]
      }
    },
    previousWeather: previous
  };
}

export function setSeason(state, season) {
  const s = SEASONS[season.toUpperCase()];
  if (!s) {
    return { success: false, error: 'Invalid season' };
  }
  
  return {
    success: true,
    state: {
      ...state,
      weather: {
        ...state.weather,
        season: s.id
      }
    }
  };
}

export function setDayTime(state, dayTime) {
  const validTimes = ['dawn', 'day', 'dusk', 'night'];
  if (!validTimes.includes(dayTime)) {
    return { success: false, error: 'Invalid day time' };
  }
  
  return {
    success: true,
    state: {
      ...state,
      weather: {
        ...state.weather,
        dayTime
      }
    }
  };
}

export function setTemperature(state, temperature) {
  if (typeof temperature !== 'number') {
    return { success: false, error: 'Temperature must be a number' };
  }
  
  return {
    success: true,
    state: {
      ...state,
      weather: {
        ...state.weather,
        temperature: Math.max(-50, Math.min(50, temperature))
      }
    }
  };
}

export function generateRandomWeather(state, seed = null) {
  const season = state.weather.season;
  const chances = SEASON_WEATHER_CHANCES[season];
  
  if (!chances) {
    return { success: false, error: 'Invalid season for weather generation' };
  }
  
  const rand = seed !== null ? seed : Math.random();
  let cumulative = 0;
  let selectedWeather = 'clear';
  
  for (const [weather, chance] of Object.entries(chances)) {
    cumulative += chance;
    if (rand <= cumulative) {
      selectedWeather = weather;
      break;
    }
  }
  
  const intensity = 0.3 + Math.random() * 0.5;
  const duration = 1800000 + Math.random() * 3600000;
  
  return setWeather(state, selectedWeather, { intensity, duration });
}

export function advanceWeather(state, elapsedTime) {
  const weather = state.weather;
  const remainingDuration = weather.duration - elapsedTime;
  
  if (remainingDuration > 0) {
    return {
      success: true,
      state: {
        ...state,
        weather: {
          ...weather,
          duration: remainingDuration
        }
      },
      weatherChanged: false
    };
  }
  
  const result = generateRandomWeather(state);
  return {
    ...result,
    weatherChanged: true,
    newWeather: result.state ? result.state.weather.current : null
  };
}

export function generateForecast(state, periods = 3) {
  const forecasts = [];
  let tempState = state;
  
  for (let i = 0; i < periods; i++) {
    const result = generateRandomWeather(tempState, Math.random());
    if (result.success) {
      const weatherType = WEATHER_TYPES[result.state.weather.current.toUpperCase()];
      forecasts.push({
        period: i + 1,
        weather: result.state.weather.current,
        name: weatherType ? weatherType.name : result.state.weather.current,
        icon: weatherType ? weatherType.icon : '?',
        intensity: result.state.weather.intensity
      });
      tempState = result.state;
    }
  }
  
  return {
    success: true,
    state: {
      ...state,
      weather: {
        ...state.weather,
        forecasts
      }
    },
    forecasts
  };
}

export function getCurrentWeather(state) {
  const weather = state.weather;
  const type = WEATHER_TYPES[weather.current.toUpperCase()];
  const effects = WEATHER_EFFECTS[weather.current] || {};
  
  return {
    found: true,
    weather: {
      type: weather.current,
      name: type ? type.name : weather.current,
      icon: type ? type.icon : '?',
      color: type ? type.color : '#ffffff',
      intensity: weather.intensity,
      duration: weather.duration,
      effects: { ...effects },
      season: weather.season,
      dayTime: weather.dayTime,
      temperature: weather.temperature
    }
  };
}

export function getWeatherEffects(state) {
  const weather = state.weather;
  const baseEffects = WEATHER_EFFECTS[weather.current] || {};
  const intensity = weather.intensity;
  
  const scaledEffects = {};
  for (const [key, value] of Object.entries(baseEffects)) {
    if (typeof value === 'number') {
      if (key === 'visibility' || key === 'movementSpeed' || key === 'combatAccuracy') {
        scaledEffects[key] = 1 - (1 - value) * intensity;
      } else {
        scaledEffects[key] = value * intensity;
      }
    } else {
      scaledEffects[key] = value;
    }
  }
  
  // Day time modifiers
  if (weather.dayTime === 'night') {
    scaledEffects.visibility = (scaledEffects.visibility || 1) * 0.6;
  } else if (weather.dayTime === 'dawn' || weather.dayTime === 'dusk') {
    scaledEffects.visibility = (scaledEffects.visibility || 1) * 0.8;
  }
  
  return {
    found: true,
    effects: scaledEffects,
    weather: weather.current,
    intensity: weather.intensity,
    dayTime: weather.dayTime
  };
}

export function applyWeatherToStats(baseStats, weatherEffects) {
  const modified = { ...baseStats };
  
  if (weatherEffects.movementSpeed && modified.speed !== undefined) {
    modified.speed = Math.round(modified.speed * weatherEffects.movementSpeed);
  }
  
  if (weatherEffects.combatAccuracy && modified.accuracy !== undefined) {
    modified.accuracy = Math.round(modified.accuracy * weatherEffects.combatAccuracy);
  }
  
  if (weatherEffects.rangedPenalty && modified.rangedAccuracy !== undefined) {
    modified.rangedAccuracy = Math.round(modified.rangedAccuracy * (1 - weatherEffects.rangedPenalty));
  }
  
  if (weatherEffects.stealthBonus && modified.stealth !== undefined) {
    modified.stealth = Math.round(modified.stealth * (1 + weatherEffects.stealthBonus));
  }
  
  return modified;
}

export function getSeasonInfo(state) {
  const season = SEASONS[state.weather.season.toUpperCase()];
  return season ? { found: true, season } : { found: false };
}

export function getDayTimeInfo(state) {
  const dayTime = state.weather.dayTime;
  const info = {
    dawn: { name: 'Dawn', icon: '🌅', lightLevel: 0.5 },
    day: { name: 'Day', icon: '☀️', lightLevel: 1.0 },
    dusk: { name: 'Dusk', icon: '🌆', lightLevel: 0.5 },
    night: { name: 'Night', icon: '🌙', lightLevel: 0.2 }
  };
  
  return info[dayTime] ? { found: true, dayTime: { id: dayTime, ...info[dayTime] } } : { found: false };
}

export function getWeatherHistory(state, limit = 10) {
  return state.weather.history.slice(-limit);
}

export function getForecasts(state) {
  return state.weather.forecasts || [];
}

export function getAllWeatherTypes() {
  return Object.values(WEATHER_TYPES);
}

export function getAllSeasons() {
  return Object.values(SEASONS);
}

export function isHazardousWeather(weatherType) {
  const hazardous = ['storm', 'hail', 'snow'];
  return hazardous.includes(weatherType);
}

export function getTemperatureDescription(temperature) {
  if (temperature <= -20) return { desc: 'Freezing', icon: '🥶', danger: true };
  if (temperature <= 0) return { desc: 'Very Cold', icon: '❄️', danger: false };
  if (temperature <= 10) return { desc: 'Cold', icon: '🌡️', danger: false };
  if (temperature <= 20) return { desc: 'Cool', icon: '🌤️', danger: false };
  if (temperature <= 30) return { desc: 'Warm', icon: '☀️', danger: false };
  if (temperature <= 40) return { desc: 'Hot', icon: '🔥', danger: false };
  return { desc: 'Extreme Heat', icon: '🥵', danger: true };
}
