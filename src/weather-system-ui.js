/**
 * Weather System UI
 */

import {
  WEATHER_TYPES,
  SEASONS,
  getCurrentWeather,
  getWeatherEffects,
  getSeasonInfo,
  getDayTimeInfo,
  getWeatherHistory,
  getForecasts,
  getAllWeatherTypes,
  getAllSeasons,
  isHazardousWeather,
  getTemperatureDescription
} from './weather-system.js';

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}

export function renderWeatherWidget(state, options = {}) {
  const { compact = false } = options;
  const weather = getCurrentWeather(state);
  
  if (!weather.found) {
    return '<div class="weather-widget empty">Weather unavailable</div>';
  }
  
  const w = weather.weather;
  const tempInfo = getTemperatureDescription(w.temperature);
  
  if (compact) {
    return '<div class="weather-widget compact" style="background-color: ' + w.color + '20">' +
      '<span class="weather-icon">' + w.icon + '</span>' +
      '<span class="weather-name">' + escapeHtml(w.name) + '</span>' +
      '<span class="temperature">' + w.temperature + '°</span>' +
    '</div>';
  }
  
  const hazardWarning = isHazardousWeather(w.type) 
    ? '<div class="hazard-warning">⚠️ Hazardous Conditions</div>' 
    : '';
  
  return '<div class="weather-widget" style="background-color: ' + w.color + '20; border-color: ' + w.color + '">' +
    '<div class="weather-main">' +
      '<span class="weather-icon large">' + w.icon + '</span>' +
      '<div class="weather-info">' +
        '<span class="weather-name">' + escapeHtml(w.name) + '</span>' +
        '<span class="weather-intensity">Intensity: ' + Math.round(w.intensity * 100) + '%</span>' +
      '</div>' +
    '</div>' +
    '<div class="weather-details">' +
      '<div class="temperature-row">' +
        '<span class="temp-icon">' + tempInfo.icon + '</span>' +
        '<span class="temp-value">' + w.temperature + '°C</span>' +
        '<span class="temp-desc">' + escapeHtml(tempInfo.desc) + '</span>' +
      '</div>' +
      '<div class="time-row">' +
        '<span class="season">' + escapeHtml(w.season) + '</span>' +
        '<span class="day-time">' + escapeHtml(w.dayTime) + '</span>' +
      '</div>' +
    '</div>' +
    hazardWarning +
  '</div>';
}

export function renderWeatherEffects(state) {
  const result = getWeatherEffects(state);
  
  if (!result.found) {
    return '<div class="weather-effects empty">No effects</div>';
  }
  
  const effects = result.effects;
  const rows = [];
  
  if (effects.visibility !== undefined) {
    const vis = Math.round(effects.visibility * 100);
    rows.push('<div class="effect-row"><span class="effect-name">👁️ Visibility</span><span class="effect-value">' + vis + '%</span></div>');
  }
  
  if (effects.movementSpeed !== undefined) {
    const speed = Math.round(effects.movementSpeed * 100);
    rows.push('<div class="effect-row"><span class="effect-name">🏃 Movement</span><span class="effect-value">' + speed + '%</span></div>');
  }
  
  if (effects.combatAccuracy !== undefined) {
    const acc = Math.round(effects.combatAccuracy * 100);
    rows.push('<div class="effect-row"><span class="effect-name">🎯 Accuracy</span><span class="effect-value">' + acc + '%</span></div>');
  }
  
  if (effects.stealthBonus !== undefined && effects.stealthBonus > 0) {
    const stealth = Math.round(effects.stealthBonus * 100);
    rows.push('<div class="effect-row bonus"><span class="effect-name">🥷 Stealth</span><span class="effect-value">+' + stealth + '%</span></div>');
  }
  
  if (effects.rangedPenalty !== undefined && effects.rangedPenalty > 0) {
    const penalty = Math.round(effects.rangedPenalty * 100);
    rows.push('<div class="effect-row penalty"><span class="effect-name">🏹 Ranged</span><span class="effect-value">-' + penalty + '%</span></div>');
  }
  
  if (effects.fireResist !== undefined && effects.fireResist !== 0) {
    const resist = Math.round(effects.fireResist * 100);
    const sign = resist > 0 ? '+' : '';
    rows.push('<div class="effect-row"><span class="effect-name">🔥 Fire Resist</span><span class="effect-value">' + sign + resist + '%</span></div>');
  }
  
  return '<div class="weather-effects">' +
    '<h4>Weather Effects</h4>' +
    rows.join('') +
  '</div>';
}

export function renderForecast(state) {
  const forecasts = getForecasts(state);
  
  if (forecasts.length === 0) {
    return '<div class="weather-forecast empty">No forecast available</div>';
  }
  
  const items = forecasts.map(f => {
    const type = WEATHER_TYPES[f.weather.toUpperCase()] || {};
    return '<div class="forecast-item" style="border-color: ' + (type.color || '#ccc') + '">' +
      '<span class="forecast-period">+' + f.period + 'h</span>' +
      '<span class="forecast-icon">' + f.icon + '</span>' +
      '<span class="forecast-name">' + escapeHtml(f.name) + '</span>' +
    '</div>';
  }).join('');
  
  return '<div class="weather-forecast">' +
    '<h4>Forecast</h4>' +
    '<div class="forecast-items">' + items + '</div>' +
  '</div>';
}

export function renderWeatherHistory(state, limit = 5) {
  const history = getWeatherHistory(state, limit);
  
  if (history.length === 0) {
    return '<div class="weather-history empty">No history</div>';
  }
  
  const items = history.map(h => {
    const type = WEATHER_TYPES[h.weather.toUpperCase()] || {};
    return '<div class="history-item">' +
      '<span class="history-icon">' + (type.icon || '?') + '</span>' +
      '<span class="history-name">' + escapeHtml(type.name || h.weather) + '</span>' +
    '</div>';
  }).join('');
  
  return '<div class="weather-history">' +
    '<h4>Recent Weather</h4>' +
    items +
  '</div>';
}

export function renderSeasonDisplay(state) {
  const result = getSeasonInfo(state);
  
  if (!result.found) {
    return '<div class="season-display empty">Unknown season</div>';
  }
  
  const season = result.season;
  return '<div class="season-display">' +
    '<span class="season-icon">' + season.icon + '</span>' +
    '<span class="season-name">' + escapeHtml(season.name) + '</span>' +
  '</div>';
}

export function renderDayTimeDisplay(state) {
  const result = getDayTimeInfo(state);
  
  if (!result.found) {
    return '<div class="day-time-display empty">Unknown time</div>';
  }
  
  const dt = result.dayTime;
  return '<div class="day-time-display">' +
    '<span class="time-icon">' + dt.icon + '</span>' +
    '<span class="time-name">' + escapeHtml(dt.name) + '</span>' +
    '<span class="light-level">Light: ' + Math.round(dt.lightLevel * 100) + '%</span>' +
  '</div>';
}

export function renderTemperatureGauge(state) {
  const weather = getCurrentWeather(state);
  if (!weather.found) {
    return '<div class="temperature-gauge empty">--</div>';
  }
  
  const temp = weather.weather.temperature;
  const info = getTemperatureDescription(temp);
  const position = ((temp + 50) / 100) * 100;
  
  return '<div class="temperature-gauge">' +
    '<div class="gauge-bar">' +
      '<div class="gauge-marker" style="left: ' + Math.max(0, Math.min(100, position)) + '%"></div>' +
    '</div>' +
    '<div class="gauge-labels">' +
      '<span>-50°</span><span>0°</span><span>50°</span>' +
    '</div>' +
    '<div class="current-temp' + (info.danger ? ' danger' : '') + '">' +
      info.icon + ' ' + temp + '°C - ' + escapeHtml(info.desc) +
    '</div>' +
  '</div>';
}

export function renderWeatherSelector(selectedType = null) {
  const types = getAllWeatherTypes();
  
  const options = types.map(t =>
    '<button class="weather-btn' + (selectedType === t.id ? ' active' : '') + '" ' +
    'data-weather="' + t.id + '" style="--weather-color: ' + t.color + '">' +
      t.icon + ' ' + escapeHtml(t.name) +
    '</button>'
  ).join('');
  
  return '<div class="weather-selector">' +
    '<h4>Set Weather</h4>' +
    '<div class="weather-options">' + options + '</div>' +
  '</div>';
}

export function renderSeasonSelector(selectedSeason = null) {
  const seasons = getAllSeasons();
  
  const options = seasons.map(s =>
    '<button class="season-btn' + (selectedSeason === s.id ? ' active' : '') + '" data-season="' + s.id + '">' +
      s.icon + ' ' + escapeHtml(s.name) +
    '</button>'
  ).join('');
  
  return '<div class="season-selector">' +
    '<h4>Set Season</h4>' +
    '<div class="season-options">' + options + '</div>' +
  '</div>';
}

export function renderWeatherPage(state) {
  const weather = getCurrentWeather(state);
  
  return '<div class="weather-page">' +
    '<header class="page-header"><h1>Weather</h1></header>' +
    '<div class="page-content">' +
      '<div class="main-weather">' +
        renderWeatherWidget(state) +
        renderTemperatureGauge(state) +
      '</div>' +
      '<div class="weather-sidebar">' +
        renderSeasonDisplay(state) +
        renderDayTimeDisplay(state) +
        renderWeatherEffects(state) +
      '</div>' +
      '<div class="weather-bottom">' +
        renderForecast(state) +
        renderWeatherHistory(state) +
      '</div>' +
    '</div>' +
  '</div>';
}

export function renderWeatherNotification(weatherType, previousWeather) {
  const newType = WEATHER_TYPES[weatherType.toUpperCase()] || { icon: '?', name: weatherType };
  const oldType = WEATHER_TYPES[previousWeather.toUpperCase()] || { icon: '?', name: previousWeather };
  
  return '<div class="weather-notification">' +
    '<span class="old-weather">' + oldType.icon + '</span>' +
    '<span class="arrow">→</span>' +
    '<span class="new-weather">' + newType.icon + '</span>' +
    '<span class="notification-text">Weather changed to ' + escapeHtml(newType.name) + '</span>' +
  '</div>';
}

export function renderMiniWeather(state) {
  const weather = getCurrentWeather(state);
  if (!weather.found) return '<span class="mini-weather">--</span>';
  
  const w = weather.weather;
  return '<span class="mini-weather" title="' + escapeHtml(w.name) + '">' +
    w.icon + ' ' + w.temperature + '°' +
  '</span>';
}
