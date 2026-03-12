/**
 * Fast Travel UI Component
 *
 * Renders the fast travel modal showing all unlocked destinations.
 */

import { getUnlockedFastTravelDestinations, canUseFastTravel } from './fast-travel.js';
import { DANGER_ICONS, MINIMAP_ROOM_ID_MAP } from './minimap.js';

/**
 * Render the fast travel button for the exploration UI.
 * @param {Object} state - Game state
 * @returns {string} HTML for the fast travel button
 */
export function renderFastTravelButton(state) {
  const { canTravel, reason } = canUseFastTravel(state);
  
  if (!canTravel) {
    return `<button class="btn btn-secondary" disabled title="${reason || 'Fast travel unavailable'}">🗺️ Fast Travel</button>`;
  }
  
  return `<button class="btn btn-primary" data-action="OPEN_FAST_TRAVEL">🗺️ Fast Travel</button>`;
}

/**
 * Render the fast travel modal.
 * @param {Object} state - Game state
 * @returns {string} HTML for the fast travel modal
 */
export function renderFastTravelModal(state) {
  const destinations = getUnlockedFastTravelDestinations(state.visitedRooms);
  const currentRoom = MINIMAP_ROOM_ID_MAP[state.world?.roomRow]?.[state.world?.roomCol];
  
  if (destinations.length === 0) {
    return `
      <div class="modal-overlay" data-action="CLOSE_FAST_TRAVEL">
        <div class="modal fast-travel-modal" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h2>🗺️ Fast Travel</h2>
            <button class="modal-close" data-action="CLOSE_FAST_TRAVEL">×</button>
          </div>
          <div class="modal-content">
            <p class="no-destinations">You haven't discovered any locations yet. Explore the world to unlock fast travel destinations!</p>
          </div>
        </div>
      </div>
    `;
  }
  
  const destinationRows = destinations.map(dest => {
    const isCurrent = dest.id === currentRoom;
    const dangerIcon = DANGER_ICONS[dest.dangerLevel] || '❓';
    
    if (isCurrent) {
      return `
        <div class="fast-travel-destination current">
          <span class="destination-icon">${dangerIcon}</span>
          <span class="destination-name">${dest.name}</span>
          <span class="destination-status">(You are here)</span>
        </div>
      `;
    }
    
    return `
      <button class="fast-travel-destination btn" data-action="FAST_TRAVEL" data-destination="${dest.id}">
        <span class="destination-icon">${dangerIcon}</span>
        <span class="destination-name">${dest.name}</span>
        <span class="destination-danger">${dest.dangerLabel}</span>
      </button>
    `;
  }).join('');
  
  return `
    <div class="modal-overlay" data-action="CLOSE_FAST_TRAVEL">
      <div class="modal fast-travel-modal" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h2>🗺️ Fast Travel</h2>
          <button class="modal-close" data-action="CLOSE_FAST_TRAVEL">×</button>
        </div>
        <div class="modal-content">
          <p class="fast-travel-instructions">Select a destination to travel instantly:</p>
          <div class="fast-travel-destinations">
            ${destinationRows}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Check if fast travel modal is currently open.
 * @param {Object} state - Game state
 * @returns {boolean}
 */
export function isFastTravelModalOpen(state) {
  return state.fastTravelModalOpen === true;
}

/**
 * Attach event handlers for the fast travel modal.
 * @param {Function} dispatch - The dispatch function for actions
 */
export function attachFastTravelHandlers(dispatch) {
  // Close modal on overlay click
  const overlay = document.querySelector('.modal-overlay[data-action="CLOSE_FAST_TRAVEL"]');
  if (overlay) {
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        dispatch({ type: 'CLOSE_FAST_TRAVEL' });
      }
    };
  }
  
  // Close button
  const closeBtn = document.querySelector('.modal-close[data-action="CLOSE_FAST_TRAVEL"]');
  if (closeBtn) {
    closeBtn.onclick = () => dispatch({ type: 'CLOSE_FAST_TRAVEL' });
  }
  
  // Destination buttons
  document.querySelectorAll('.fast-travel-destination[data-action="FAST_TRAVEL"]').forEach(btn => {
    btn.onclick = () => {
      dispatch({ type: 'FAST_TRAVEL', destination: btn.dataset.destination });
    };
  });
}

/**
 * Get CSS styles for the fast travel UI.
 * @returns {string} CSS styles
 */
export function getFastTravelStyles() {
  return `
    .fast-travel-modal {
      min-width: 320px;
      max-width: 450px;
    }
    
    .fast-travel-instructions {
      margin-bottom: 1rem;
      color: #aaa;
    }
    
    .fast-travel-destinations {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .fast-travel-destination {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 6px;
      background: #2a2a3a;
      border: 1px solid #444;
      transition: background 0.2s, border-color 0.2s;
    }
    
    .fast-travel-destination.btn {
      cursor: pointer;
      text-align: left;
    }
    
    .fast-travel-destination.btn:hover {
      background: #3a3a4a;
      border-color: #666;
    }
    
    .fast-travel-destination.current {
      background: #1a3a2a;
      border-color: #3a6;
      cursor: default;
    }
    
    .destination-icon {
      font-size: 1.25rem;
    }
    
    .destination-name {
      flex: 1;
      font-weight: bold;
    }
    
    .destination-danger {
      font-size: 0.85rem;
      color: #888;
    }
    
    .destination-status {
      font-size: 0.85rem;
      color: #6a6;
      font-style: italic;
    }
    
    .no-destinations {
      color: #888;
      text-align: center;
      padding: 1rem;
    }
  `;
}
