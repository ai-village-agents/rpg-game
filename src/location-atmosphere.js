/**
 * Location Atmosphere System
 * 
 * Provides rich flavor text, ambient descriptions, and visual theming
 * for each map location to enhance the exploration experience.
 * Each location has time-of-day variations and random ambient events.
 */

/**
 * Location atmosphere data keyed by room ID.
 * Each entry has descriptions, ambient events, and CSS theme colors.
 */
const LOCATION_DATA = {
  nw: {
    name: 'Northwest Grove',
    icon: '🌲',
    description: 'Ancient trees tower overhead, their intertwined canopy filtering sunlight into dancing patterns on the mossy floor.',
    ambientEvents: [
      'A woodpecker drums rhythmically on a distant trunk.',
      'Fireflies drift lazily between the ferns.',
      'The scent of pine and damp earth fills the air.',
      'A gentle breeze rustles the high branches overhead.',
      'Mushrooms glow faintly along a rotting log nearby.',
      'A squirrel watches you curiously from a branch.',
    ],
    themeColor: 'rgba(34, 139, 34, 0.08)',
    borderAccent: 'rgba(34, 139, 34, 0.25)',
  },
  n: {
    name: 'Northern Path',
    icon: '🛤️',
    description: 'A well-worn path winds northward through rocky terrain, flanked by weathered stone pillars marking an ancient boundary.',
    ambientEvents: [
      'Distant thunder rumbles beyond the mountains.',
      'Wind whistles through gaps in the stone pillars.',
      'Pebbles crunch softly underfoot as you walk.',
      'A hawk circles high above the path.',
      'Faded runes on the stone pillars catch the light.',
      'A cold gust sweeps down from the northern peaks.',
    ],
    themeColor: 'rgba(128, 128, 160, 0.08)',
    borderAccent: 'rgba(128, 128, 160, 0.25)',
  },
  ne: {
    name: 'Northeast Ridge',
    icon: '⛰️',
    description: 'Craggy rocks jut from the hillside, offering panoramic views of the surrounding lands. The air is thin and crisp.',
    ambientEvents: [
      'An eagle soars on the thermal currents below.',
      'Loose gravel shifts under your weight.',
      'The wind carries the faint sound of a bell from the valley.',
      'Cloud shadows race across the landscape far below.',
      'A mountain goat watches from a higher ledge.',
      'Crystals embedded in the rock face catch the sunlight.',
    ],
    themeColor: 'rgba(160, 140, 120, 0.08)',
    borderAccent: 'rgba(160, 140, 120, 0.25)',
  },
  w: {
    name: 'Western Crossing',
    icon: '🌉',
    description: 'A stone bridge arches over a shallow stream. Wagon tracks in the muddy road hint at regular trade traffic.',
    ambientEvents: [
      'Water gurgles and splashes beneath the bridge.',
      'A merchant cart rattles in the distance.',
      'Dragonflies skim the surface of the stream.',
      'The bridge stones are warm from the afternoon sun.',
      'A fish leaps from the water and splashes back down.',
      'Wildflowers line the roadside in vibrant clusters.',
    ],
    themeColor: 'rgba(70, 130, 180, 0.08)',
    borderAccent: 'rgba(70, 130, 180, 0.25)',
  },
  center: {
    name: 'Village Square',
    icon: '🏘️',
    description: 'The heart of the settlement bustles with activity. A stone fountain marks the center, surrounded by market stalls and well-kept buildings.',
    ambientEvents: [
      'A blacksmith\'s hammer rings from a nearby forge.',
      'Children chase each other around the fountain.',
      'The aroma of fresh bread drifts from the bakery.',
      'A bard strums a lute on the fountain steps.',
      'Market vendors call out their wares to passersby.',
      'A cat dozes on a sunny windowsill.',
    ],
    themeColor: 'rgba(218, 165, 32, 0.08)',
    borderAccent: 'rgba(218, 165, 32, 0.25)',
  },
  e: {
    name: 'Eastern Fields',
    icon: '🌾',
    description: 'Golden fields stretch to the horizon under wide open skies. Scarecrows stand sentinel among the waving grain.',
    ambientEvents: [
      'Wheat stalks whisper in the warm breeze.',
      'A scarecrow\'s tattered coat flaps in the wind.',
      'Butterflies flutter between wildflower patches.',
      'A farmer waves from a distant hillside.',
      'The rich smell of tilled earth rises around you.',
      'Crows argue noisily atop a wooden fence.',
    ],
    themeColor: 'rgba(210, 180, 60, 0.08)',
    borderAccent: 'rgba(210, 180, 60, 0.25)',
  },
  sw: {
    name: 'Southwest Marsh',
    icon: '🌿',
    description: 'Mist clings to the boggy ground. Twisted trees rise from dark water, their gnarled roots creating treacherous footing.',
    ambientEvents: [
      'Frogs croak in a discordant chorus.',
      'Bubbles rise from the murky water nearby.',
      'A will-o\'-wisp flickers and vanishes in the fog.',
      'The ground squelches with each careful step.',
      'An eerie silence falls suddenly, then lifts.',
      'Cypress roots form a natural stairway into the muck.',
    ],
    themeColor: 'rgba(60, 100, 60, 0.08)',
    borderAccent: 'rgba(60, 100, 60, 0.25)',
  },
  s: {
    name: 'Southern Road',
    icon: '🏜️',
    description: 'The road stretches south toward arid lands. The sun beats down relentlessly on cracked paving stones.',
    ambientEvents: [
      'Heat shimmers rise from the sun-baked stones.',
      'A lizard darts across the road into dry brush.',
      'Dust devils spin lazily in a nearby field.',
      'The distant clang of a caravan bell echoes.',
      'Dried thistles rattle in a hot breeze.',
      'A roadside shrine offers shade beneath a stone arch.',
    ],
    themeColor: 'rgba(180, 140, 80, 0.08)',
    borderAccent: 'rgba(180, 140, 80, 0.25)',
  },
  se: {
    name: 'Southeast Dock',
    icon: '⚓',
    description: 'Weathered wooden docks extend into calm waters. Fishing boats bob gently, their nets spread out to dry in the salty breeze.',
    ambientEvents: [
      'Seagulls cry as they wheel overhead.',
      'Waves lap softly against the wooden pilings.',
      'A fisherman mends nets while humming a sea shanty.',
      'The sharp tang of salt and seaweed fills the air.',
      'A bell buoy chimes somewhere out in the harbor.',
      'Crabs scuttle between the dock planks.',
    ],
    themeColor: 'rgba(70, 130, 180, 0.08)',
    borderAccent: 'rgba(70, 130, 180, 0.25)',
  },
};

/** Map from (row, col) coordinates to room ID */
export const COORD_TO_ROOM = {
  '0,0': 'nw', '0,1': 'n', '0,2': 'ne',
  '1,0': 'w',  '1,1': 'center', '1,2': 'e',
  '2,0': 'sw', '2,1': 's', '2,2': 'se',
};

/**
 * Get location data for a given room.
 * @param {object} opts
 * @param {string} [opts.roomId] - Direct room ID
 * @param {number} [opts.roomRow] - Room row coordinate
 * @param {number} [opts.roomCol] - Room column coordinate
 * @returns {object|null} Location data or null if not found
 */
export function getLocationData({ roomId, roomRow, roomCol } = {}) {
  const id = roomId || COORD_TO_ROOM[`${roomRow},${roomCol}`];
  return id ? (LOCATION_DATA[id] || null) : null;
}

/**
 * Get a random ambient event for a location.
 * @param {string} roomId - The room ID
 * @returns {string|null} A random ambient description or null
 */
export function getAmbientEvent(roomId) {
  const data = LOCATION_DATA[roomId];
  if (!data || !data.ambientEvents?.length) return null;
  return data.ambientEvents[Math.floor(Math.random() * data.ambientEvents.length)];
}

/**
 * Get ambient event by room coordinates.
 * @param {number} roomRow
 * @param {number} roomCol
 * @returns {string|null}
 */
export function getAmbientEventByCoords(roomRow, roomCol) {
  const roomId = COORD_TO_ROOM[`${roomRow},${roomCol}`];
  return roomId ? getAmbientEvent(roomId) : null;
}

/**
 * Render a location atmosphere panel for the exploration view.
 * @param {object} state - Game state
 * @returns {string} HTML string for the atmosphere panel
 */
export function renderAtmospherePanel(state) {
  const roomRow = state?.world?.roomRow ?? 1;
  const roomCol = state?.world?.roomCol ?? 1;
  const roomId = COORD_TO_ROOM[`${roomRow},${roomCol}`];
  const data = LOCATION_DATA[roomId];

  if (!data) {
    return '<div class="atmosphere-panel"><em>An unremarkable area.</em></div>';
  }

  const ambient = getAmbientEvent(roomId);

  return (
    `<div class="atmosphere-panel" style="` +
      `background:${data.themeColor};` +
      `border-left:3px solid ${data.borderAccent};` +
      `padding:10px 14px;margin:6px 0;border-radius:6px;">` +
      `<div style="font-size:1.1em;margin-bottom:4px;">` +
        `<span style="margin-right:6px;">${data.icon}</span>` +
        `<strong>${escapeHtml(data.name)}</strong>` +
      `</div>` +
      `<div style="color:var(--muted);font-size:0.9em;font-style:italic;margin-bottom:6px;">` +
        `${escapeHtml(data.description)}` +
      `</div>` +
      (ambient
        ? `<div style="color:var(--text);font-size:0.85em;opacity:0.7;">` +
          `${escapeHtml(ambient)}</div>`
        : '') +
    `</div>`
  );
}

/**
 * Get the CSS inline styles for a location-themed card border.
 * @param {number} roomRow
 * @param {number} roomCol
 * @returns {string} CSS inline style string
 */
export function getLocationBorderStyle(roomRow, roomCol) {
  const roomId = COORD_TO_ROOM[`${roomRow},${roomCol}`];
  const data = LOCATION_DATA[roomId];
  if (!data) return '';
  return `border-top:2px solid ${data.borderAccent};`;
}

/**
 * Get all location names and icons for map display.
 * @returns {Array<{id: string, name: string, icon: string, row: number, col: number}>}
 */
export function getAllLocations() {
  return Object.entries(COORD_TO_ROOM).map(([coords, roomId]) => {
    const [row, col] = coords.split(',').map(Number);
    const data = LOCATION_DATA[roomId];
    return {
      id: roomId,
      name: data?.name ?? roomId,
      icon: data?.icon ?? '❓',
      row,
      col,
    };
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
