export const TIME_OF_DAY = {
  MORNING: 'morning',
  AFTERNOON: 'afternoon',
  EVENING: 'evening',
  NIGHT: 'night',
};

export const WEATHER_TYPES = {
  CLEAR: 'clear',
  SUNNY: 'sunny',
  RAINY: 'rainy',
  STORMY: 'stormy',
  FOGGY: 'foggy',
};

export const TIME_ICONS = {
  [TIME_OF_DAY.MORNING]: '🌅',
  [TIME_OF_DAY.AFTERNOON]: '☀️',
  [TIME_OF_DAY.EVENING]: '🌆',
  [TIME_OF_DAY.NIGHT]: '🌙',
};

export const WEATHER_ICONS = {
  [WEATHER_TYPES.CLEAR]: '🌤️',
  [WEATHER_TYPES.SUNNY]: '☀️',
  [WEATHER_TYPES.RAINY]: '🌧️',
  [WEATHER_TYPES.STORMY]: '⛈️',
  [WEATHER_TYPES.FOGGY]: '🌫️',
};

export const TIME_CYCLE_LENGTH = 8;
export const WEATHER_CHANGE_CHANCE = 0.25;
export const WEATHER_POOL = [
  WEATHER_TYPES.CLEAR,
  WEATHER_TYPES.SUNNY,
  WEATHER_TYPES.RAINY,
  WEATHER_TYPES.STORMY,
  WEATHER_TYPES.FOGGY,
  WEATHER_TYPES.CLEAR,
  WEATHER_TYPES.SUNNY,
  WEATHER_TYPES.RAINY,
];

export function createWeatherState() {
  return {
    timeOfDay: TIME_OF_DAY.MORNING,
    weather: WEATHER_TYPES.CLEAR,
    movesInCurrentTime: 0,
    totalMoves: 0,
  };
}

export function advanceTime(weatherState) {
  const current = weatherState ?? createWeatherState();
  const movesInCurrentTime = current.movesInCurrentTime + 1;
  const totalMoves = (current.totalMoves ?? 0) + 1;

  if (movesInCurrentTime < TIME_CYCLE_LENGTH) {
    return {
      ...current,
      movesInCurrentTime,
      totalMoves,
    };
  }

  const order = [
    TIME_OF_DAY.MORNING,
    TIME_OF_DAY.AFTERNOON,
    TIME_OF_DAY.EVENING,
    TIME_OF_DAY.NIGHT,
  ];
  const index = order.indexOf(current.timeOfDay);
  const nextTime = order[(index + 1) % order.length];

  return {
    ...current,
    timeOfDay: nextTime,
    movesInCurrentTime: 0,
    totalMoves,
  };
}

export function tryChangeWeather(weatherState, seed) {
  const current = weatherState ?? createWeatherState();
  const shouldChange = Math.abs(seed) % 100 < WEATHER_CHANGE_CHANCE * 100;
  if (!shouldChange) return { ...current };

  const index = Math.abs(seed) % WEATHER_POOL.length;
  const nextWeather = WEATHER_POOL[index];
  return {
    ...current,
    weather: nextWeather,
  };
}

export function getEncounterRateModifier(weatherState) {
  const weather = weatherState?.weather ?? WEATHER_TYPES.CLEAR;
  const time = weatherState?.timeOfDay ?? TIME_OF_DAY.MORNING;

  const weatherModifier = weather === WEATHER_TYPES.FOGGY
    ? 0.6
    : weather === WEATHER_TYPES.STORMY
      ? 1.5
      : weather === WEATHER_TYPES.RAINY
        ? 1.2
        : 1.0;

  const timeModifier = time === TIME_OF_DAY.NIGHT
    ? 1.4
    : time === TIME_OF_DAY.MORNING
      ? 1.1
      : time === TIME_OF_DAY.EVENING
        ? 1.2
        : 1.0;

  return weatherModifier * timeModifier;
}

export function getCombatStatModifiers(weatherState, enemyId) {
  const weather = weatherState?.weather ?? WEATHER_TYPES.CLEAR;
  const time = weatherState?.timeOfDay ?? TIME_OF_DAY.MORNING;

  let atkModifier = 1.0;
  let defModifier = 1.0;
  let spdModifier = 1.0;

  if (weather === WEATHER_TYPES.RAINY && enemyId === 'fire-spirit') {
    atkModifier *= 0.75;
    defModifier *= 0.8;
  }

  if (weather === WEATHER_TYPES.STORMY && enemyId === 'thunder-hawk') {
    atkModifier *= 1.35;
    spdModifier *= 1.25;
  }

  if (weather === WEATHER_TYPES.FOGGY) {
    defModifier *= 0.9;
  }

  if (time === TIME_OF_DAY.NIGHT && enemyId === 'wraith') {
    atkModifier *= 1.3;
    spdModifier *= 1.2;
  }

  if (time === TIME_OF_DAY.MORNING && enemyId === 'slime') {
    spdModifier *= 0.85;
  }

  return {
    atkModifier,
    defModifier,
    spdModifier,
  };
}

function toTitleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getWeatherDescription(weatherState) {
  const weather = weatherState?.weather ?? WEATHER_TYPES.CLEAR;
  const time = weatherState?.timeOfDay ?? TIME_OF_DAY.MORNING;

  const weatherText = weather === WEATHER_TYPES.CLEAR
    ? 'clear'
    : weather === WEATHER_TYPES.SUNNY
      ? 'sunny'
      : weather === WEATHER_TYPES.RAINY
        ? 'rainy'
        : weather === WEATHER_TYPES.STORMY
          ? 'stormy'
          : weather === WEATHER_TYPES.FOGGY
            ? 'foggy'
            : 'strange';

  const timeText = time === TIME_OF_DAY.MORNING
    ? 'morning'
    : time === TIME_OF_DAY.AFTERNOON
      ? 'afternoon'
      : time === TIME_OF_DAY.EVENING
        ? 'evening'
        : time === TIME_OF_DAY.NIGHT
          ? 'night'
          : 'time';

  const article = /^[aeiou]/i.test(weatherText) ? 'An' : 'A';
  return `${article} ${weatherText} ${timeText} in the wilderness.`;
}

export function getWeatherBanner(weatherState) {
  const time = weatherState?.timeOfDay ?? TIME_OF_DAY.MORNING;
  const weather = weatherState?.weather ?? WEATHER_TYPES.CLEAR;
  const timeLabel = toTitleCase(time);
  const weatherLabel = toTitleCase(weather);
  const timeIcon = TIME_ICONS[time] ?? '';
  const weatherIcon = WEATHER_ICONS[weather] ?? '';
  return `${timeIcon} ${timeLabel} | ${weatherIcon} ${weatherLabel}`.trim();
}

export function hasWeatherSystem(state) {
  return Boolean(state?.weatherState && state.weatherState.timeOfDay !== undefined);
}
