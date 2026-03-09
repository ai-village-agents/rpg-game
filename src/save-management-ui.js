import { formatSaveTimestamp, exportSaveToJSON, importSaveFromJSON, renameSave, AUTOSAVE_SLOT } from './save-system.js';
import { getSaveSlots, deleteSaveSlot, loadFromSlot, saveToSlot, on } from './engine.js';

/**
 * Escape HTML characters for safe rendering.
 * @param {string} value
 * @returns {string}
 */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render a single save slot card.
 * @param {object} slotData
 * @returns {string}
 */
export function renderSaveSlotCard(slotData = {}) {
  const index = Number.isInteger(slotData.index) ? slotData.index : 0;
  const slotLabel = index === AUTOSAVE_SLOT ? 'Auto-Save' : `Slot ${index + 1}`;
  const exists = slotData.exists ?? !!slotData.savedAt;
  const displayName = slotData.customName?.trim()
    ? slotData.customName.trim()
    : slotData.playerName || slotData.player?.name || 'Unknown Hero';
  const level = slotData.playerLevel ?? slotData.player?.level;
  const playerClass = slotData.playerClass || slotData.player?.classId || slotData.player?.class || 'Adventurer';
  const location = slotData.location || slotData.saveMetadata?.location || 'Unknown Location';
  const formattedTime = exists ? formatSaveTimestamp(slotData.savedAt) : 'Empty';
  const turn = typeof slotData.turn === 'number'
    ? slotData.turn
    : typeof slotData.saveMetadata?.turn === 'number'
      ? slotData.saveMetadata.turn
      : 0;

  const saveButton = index === AUTOSAVE_SLOT ? '' : `<button class="save-btn save-btn-primary" data-save-action="save" data-slot-index="${index}">Save</button>`;
  const disabledAttrs = exists ? '' : ' disabled';

  return `
    <div class="save-card" data-slot-index="${index}">
      <div class="save-card-header">
        <div class="save-slot-label">${esc(slotLabel)}</div>
        <div class="save-slot-time">${esc(formattedTime)}</div>
      </div>
      <div class="save-card-body">
        <div class="save-slot-name">${esc(displayName)}</div>
        <div class="save-slot-meta">
          <span class="save-slot-level">${esc(level !== undefined ? `Lv ${level}` : 'Lv ?')}</span>
          <span class="save-slot-class">${esc(playerClass)}</span>
        </div>
        <div class="save-slot-location">${esc(location)}</div>
        <div class="save-slot-turn">Turn ${turn}</div>
      </div>
      <div class="save-card-actions">
        <button class="save-btn" data-save-action="load" data-slot-index="${index}"${disabledAttrs}>Load</button>
        ${saveButton}
        <button class="save-btn save-btn-danger" data-save-action="delete" data-slot-index="${index}"${disabledAttrs}>Delete</button>
        <button class="save-btn" data-save-action="rename" data-slot-index="${index}"${disabledAttrs}>Rename</button>
        <button class="save-btn" data-save-action="export" data-slot-index="${index}"${disabledAttrs}>Export</button>
      </div>
    </div>
  `;
}

/**
 * Render the full save management panel.
 * @returns {string}
 */
export function renderSaveManagementPanel() {
  const slots = getSaveSlots();
  const cards = slots.map(renderSaveSlotCard).join('\n');

  return `
    <section class="save-panel">
      <header class="save-panel-header">
        <div class="save-panel-title">Save Management</div>
        <div class="save-panel-controls">
          <label class="save-autosave-toggle">
            <input type="checkbox" class="save-autosave-checkbox" checked>
            <span>Auto-save</span>
          </label>
          <div class="save-import-control">
            <button type="button" class="save-btn save-btn-secondary save-btn-import">Import</button>
            <input type="file" class="save-import-input" accept="application/json" hidden>
          </div>
        </div>
      </header>
      <div class="save-slot-grid">
        ${cards}
      </div>
    </section>
  `;
}

/**
 * Handle an action triggered on a save slot button.
 * @param {'load'|'save'|'delete'|'rename'|'export'} action
 * @param {number} slotIndex
 */
export function handleSlotAction(action, slotIndex) {
  const idx = Number(slotIndex);
  if (!Number.isInteger(idx)) return;

  if (action === 'load') {
    const data = loadFromSlot(idx);
    if (!data) {
      alert('No save found in this slot.');
      return;
    }
    document.dispatchEvent(new CustomEvent('save-ui:load', { detail: { slotIndex: idx, data } }));
    return;
  }

  if (action === 'save') {
    if (idx === AUTOSAVE_SLOT) {
      alert('Manual saves cannot use the auto-save slot.');
      return;
    }
    const name = prompt('Enter a custom name for this save (optional):', '') ?? '';
    const detail = { slotIndex: idx, state: null };
    document.dispatchEvent(new CustomEvent('save-ui:request-state', { detail }));
    const currentState = detail.state || globalThis.currentGameState || globalThis.gameState || null;
    if (!currentState || typeof currentState !== 'object') {
      alert('Current game state is unavailable to save.');
      return;
    }
    const payload = { ...currentState };
    if (name.trim()) {
      payload.customName = name.trim();
    }
    const saved = saveToSlot(payload, idx);
    if (saved) {
      document.dispatchEvent(new CustomEvent('save-ui:saved', { detail: { slotIndex: idx, customName: payload.customName || '' } }));
    } else {
      alert('Save failed. Please try again.');
    }
    return;
  }

  if (action === 'delete') {
    const confirmed = confirm('Delete this save slot? This cannot be undone.');
    if (!confirmed) return;
    deleteSaveSlot(idx);
    document.dispatchEvent(new CustomEvent('save-ui:deleted', { detail: { slotIndex: idx } }));
    return;
  }

  if (action === 'rename') {
    const newName = prompt('Enter a new name for this save:', '');
    if (newName === null) return;
    const result = renameSave(idx, newName);
    if (!result.success) {
      alert(result.error || 'Rename failed.');
      return;
    }
    document.dispatchEvent(new CustomEvent('save-ui:renamed', { detail: { slotIndex: idx, customName: newName.trim() } }));
    return;
  }

  if (action === 'export') {
    const json = exportSaveToJSON(idx);
    if (!json) {
      alert('No save data available to export.');
      return;
    }
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `save-slot-${idx + 1}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    document.dispatchEvent(new CustomEvent('save-ui:exported', { detail: { slotIndex: idx } }));
  }
}

/**
 * Import a save file into a selected slot.
 * @param {File} file
 */
export async function handleImport(file) {
  if (!file) return;
  const slotInput = prompt('Import into which slot? (1-5, 5 is auto-save)', '1');
  if (slotInput === null) return;
  const slot = Number.parseInt(slotInput, 10) - 1;
  if (!Number.isInteger(slot) || slot < 0 || slot > AUTOSAVE_SLOT) {
    alert('Invalid slot. Choose a slot between 1 and 5.');
    return;
  }
  const contents = await file.text();
  const result = importSaveFromJSON(contents, slot);
  if (!result.success) {
    alert(result.error || 'Import failed.');
    return;
  }
  document.dispatchEvent(new CustomEvent('save-ui:imported', { detail: { slotIndex: slot } }));
}

/**
 * Initialize save management event handlers with event delegation.
 * @param {string|HTMLElement} containerSelector
 */
export function initSaveManagementUI(containerSelector) {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector;
  if (!container) return;

  container.addEventListener('click', (event) => {
    const actionBtn = event.target.closest('[data-save-action]');
    if (actionBtn && container.contains(actionBtn)) {
      const action = actionBtn.getAttribute('data-save-action');
      const slotIndex = Number(actionBtn.getAttribute('data-slot-index'));
      handleSlotAction(action, slotIndex);
      return;
    }

    const importBtn = event.target.closest('.save-btn-import');
    if (importBtn && container.contains(importBtn)) {
      const input = container.querySelector('.save-import-input');
      if (input) input.click();
    }
  });

  container.addEventListener('change', (event) => {
    const target = event.target;
    if (target && target.classList.contains('save-import-input')) {
      const [file] = target.files || [];
      handleImport(file);
      target.value = '';
    }
    if (target && target.classList.contains('save-autosave-checkbox')) {
      const enabled = target.checked;
      document.dispatchEvent(new CustomEvent('save-ui:autosave-toggle', { detail: { enabled } }));
    }
  });

  const syncAutoToggle = (enabled) => {
    const checkbox = container.querySelector('.save-autosave-checkbox');
    if (checkbox) checkbox.checked = !!enabled;
  };

  on('autosave:enabled', () => syncAutoToggle(true));
  on('autosave:disabled', () => syncAutoToggle(false));
}
