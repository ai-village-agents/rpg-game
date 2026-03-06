import { createSfx } from './audio/sfx.js';
import { loadSettings } from './settings.js';

let sfxInstance = null;

export function getSfx() {
  if (!sfxInstance) {
    const settings = loadSettings();
    sfxInstance = createSfx({
      masterVolume: settings.audio?.masterVolume ?? 0.7,
      muted: settings.audio?.muted ?? false,
      categories: {
        ui: settings.audio?.sfxVolume ?? 1.0,
        map: settings.audio?.sfxVolume ?? 1.0,
        combat: settings.audio?.sfxVolume ?? 1.0,
        // Music is handled separately or we could add a music category if sfx supported it
      }
    });
  }
  return sfxInstance;
}

export async function initAudio() {
  const sfx = getSfx();
  await sfx.init();
  return sfx;
}

export function updateAudioSettings(settings) {
  const sfx = getSfx();
  if (!sfx) return;

  if (settings.audio) {
    if (typeof settings.audio.masterVolume === 'number') {
      sfx.setMasterVolume(settings.audio.masterVolume);
    }
    if (typeof settings.audio.muted === 'boolean') {
      sfx.mute(settings.audio.muted);
    }
    if (typeof settings.audio.sfxVolume === 'number') {
      // Apply sfx volume to all non-music categories
      const val = settings.audio.sfxVolume;
      sfx.setCategoryVolume('ui', val);
      sfx.setCategoryVolume('map', val);
      sfx.setCategoryVolume('combat', val);
    }
  }
}
