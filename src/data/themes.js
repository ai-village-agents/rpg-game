/**
 * UI Themes Module
 * Color palettes for different visual themes
 */

export const THEMES = {
  midnight: {
    id: 'midnight',
    name: 'Midnight (Default)',
    colors: {
      bg: '#0b1020',
      panel: '#121a33',
      text: '#e8eeff',
      muted: '#a7b3da',
      accent: '#7aa2ff',
      bad: '#ff6b6b',
      good: '#57d38c',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#0d1a0d',
      panel: '#152415',
      text: '#e8ffe8',
      muted: '#a7daa7',
      accent: '#7aff7a',
      bad: '#ff6b6b',
      good: '#57d38c',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson',
    colors: {
      bg: '#1a0d0d',
      panel: '#251515',
      text: '#ffe8e8',
      muted: '#daa7a7',
      accent: '#ff7a7a',
      bad: '#ff6b6b',
      good: '#57d38c',
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#0d1a1a',
      panel: '#152525',
      text: '#e8ffff',
      muted: '#a7dada',
      accent: '#7affff',
      bad: '#ff6b6b',
      good: '#57d38c',
    },
  },
  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      bg: '#f5f5f5',
      panel: '#ffffff',
      text: '#1a1a2e',
      muted: '#666680',
      accent: '#3366cc',
      bad: '#cc3333',
      good: '#339944',
    },
  },
};

export const DEFAULT_THEME = 'midnight';

/**
 * Apply a theme to the document
 * @param {string} themeId - Theme ID to apply
 */
export function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}

/**
 * Get list of available themes for UI
 * @returns {Array<{id: string, name: string}>}
 */
export function getThemeList() {
  return Object.values(THEMES).map(t => ({ id: t.id, name: t.name }));
}
