import {
  TIME_ICONS,
  WEATHER_ICONS,
  getEncounterRateModifier,
  getWeatherBanner,
  getWeatherDescription,
} from './weather.js';

function toTitleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function renderWeatherBar(weatherState) {
  const time = weatherState?.timeOfDay ?? 'morning';
  const weather = weatherState?.weather ?? 'clear';
  const banner = getWeatherBanner(weatherState);
  const timeIcon = TIME_ICONS[time] ?? '';
  const weatherIcon = WEATHER_ICONS[weather] ?? '';
  const timeLabel = toTitleCase(time);
  const weatherLabel = toTitleCase(weather);

  return (
    `<div class="weather-bar" aria-label="${banner}">` +
    `<span class="weather-icon">${timeIcon}</span>` +
    `<span class="weather-time">${timeLabel}</span>` +
    `<span class="weather-separator"> | </span>` +
    `<span class="weather-icon">${weatherIcon}</span>` +
    `<span class="weather-condition">${weatherLabel}</span>` +
    `</div>`
  );
}

export function renderWeatherTooltip(weatherState) {
  const modifier = getEncounterRateModifier(weatherState);
  const description = getWeatherDescription(weatherState);
  const modifierText = modifier.toFixed(2);
  return (
    `<div class="weather-tooltip">` +
    `<div class="weather-tooltip-line">Encounter rate: x${modifierText}</div>` +
    `<div class="weather-tooltip-line">${description}</div>` +
    `</div>`
  );
}

export function getWeatherBarCSS() {
  return (
    `.weather-bar {` +
    ` display: flex;` +
    ` align-items: center;` +
    ` gap: 6px;` +
    ` padding: 6px 10px;` +
    ` background: #1b1f2a;` +
    ` color: #e7edf5;` +
    ` font-family: "Trebuchet MS", "DejaVu Sans", sans-serif;` +
    ` font-size: 0.95rem;` +
    ` border-radius: 6px;` +
    ` box-shadow: inset 0 0 0 1px #2a3140;` +
    `}` +
    `.weather-bar .weather-separator {` +
    ` opacity: 0.6;` +
    `}` +
    `.weather-tooltip {` +
    ` background: #11151f;` +
    ` color: #e7edf5;` +
    ` padding: 8px 10px;` +
    ` border-radius: 6px;` +
    ` font-size: 0.9rem;` +
    ` box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);` +
    `}` +
    `.weather-tooltip-line {` +
    ` margin-bottom: 4px;` +
    `}` +
    `.weather-tooltip-line:last-child {` +
    ` margin-bottom: 0;` +
    `}`
  );
}
