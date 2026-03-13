/**
 * Dialogue System UI Components
 * UI for NPC conversations and choices
 */

import {
  NODE_TYPES,
  getCurrentNode,
  getAvailableChoices,
  getDialogueStats,
  processActions
} from './dialogue-system.js';

// HTML escape helper
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Render dialogue box
export function renderDialogueBox(state, registry, npcName, gameState = {}) {
  const node = getCurrentNode(state, registry);

  if (!node) {
    return '';
  }

  let content = '';

  switch (node.type) {
    case NODE_TYPES.TEXT:
      content = renderTextNode(node, npcName);
      break;
    case NODE_TYPES.CHOICE:
      content = renderChoiceNode(node, npcName, gameState);
      break;
    case NODE_TYPES.END:
      content = renderEndNode(npcName);
      break;
    default:
      content = `<p>Processing...</p>`;
  }

  return `
    <div class="dialogue-box">
      ${content}
    </div>
  `;
}

// Render text node
function renderTextNode(node, npcName) {
  return `
    <div class="dialogue-content">
      <div class="dialogue-speaker">${escapeHtml(npcName)}</div>
      <div class="dialogue-text">${escapeHtml(node.text)}</div>
      <button class="dialogue-continue" data-action="continue">Continue</button>
    </div>
  `;
}

// Render choice node
function renderChoiceNode(node, npcName, gameState = {}) {
  const choices = getAvailableChoices(node, gameState);

  const choiceButtons = choices.map(choice => `
    <button class="dialogue-choice" data-action="choice" data-index="${choice.index}">
      ${escapeHtml(choice.text)}
    </button>
  `).join('');

  return `
    <div class="dialogue-content">
      <div class="dialogue-speaker">${escapeHtml(npcName)}</div>
      <div class="dialogue-text">${escapeHtml(node.text)}</div>
      <div class="dialogue-choices">
        ${choiceButtons}
      </div>
    </div>
  `;
}

// Render end node
function renderEndNode(npcName) {
  return `
    <div class="dialogue-content">
      <div class="dialogue-speaker">${escapeHtml(npcName)}</div>
      <div class="dialogue-text">...</div>
      <button class="dialogue-end" data-action="end">End Conversation</button>
    </div>
  `;
}

// Render action results
export function renderActionResults(actions) {
  if (!actions || actions.length === 0) {
    return '';
  }

  const processed = processActions(actions);

  const items = processed.map(result => `
    <div class="action-result action-${escapeHtml(result.type)}">
      <span class="action-icon">${getActionIcon(result.type)}</span>
      <span class="action-text">${escapeHtml(result.description)}</span>
    </div>
  `).join('');

  return `
    <div class="dialogue-actions">
      ${items}
    </div>
  `;
}

// Get action icon
function getActionIcon(actionType) {
  const icons = {
    'give_item': '📦',
    'take_item': '📤',
    'give_gold': '💰',
    'take_gold': '💸',
    'start_quest': '📜',
    'complete_quest': '✅',
    'set_flag': '🚩',
    'add_reputation': '⭐',
    'open_shop': '🏪'
  };
  return icons[actionType] || '❓';
}

// Render NPC indicator (speech bubble above NPC)
export function renderNpcIndicator(hasDialogue, isAvailable = true) {
  if (!hasDialogue) return '';

  const indicatorClass = isAvailable ? 'indicator-available' : 'indicator-busy';

  return `
    <div class="npc-indicator ${indicatorClass}">
      <span class="indicator-icon">💬</span>
    </div>
  `;
}

// Render dialogue history
export function renderDialogueHistory(history, registry) {
  if (!history || history.length === 0) {
    return '<p class="no-history">No conversation history</p>';
  }

  const items = history.map(entry => {
    const dialogue = registry.dialogues[entry.dialogueId];
    const npcId = dialogue?.npcId || 'Unknown';

    return `
      <div class="history-item">
        <span class="history-npc">${escapeHtml(npcId)}</span>
        <span class="history-time">${formatTime(entry.startedAt)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="dialogue-history">
      <h4>Recent Conversations</h4>
      ${items}
    </div>
  `;
}

// Format time helper
function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

// Render dialogue stats
export function renderDialogueStatsPanel(state) {
  const stats = getDialogueStats(state);

  return `
    <div class="dialogue-stats-panel">
      <h4>Dialogue Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.conversationsStarted}</span>
          <span class="stat-label">Conversations</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.conversationsCompleted}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.choicesMade}</span>
          <span class="stat-label">Choices Made</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.flagsSet}</span>
          <span class="stat-label">Flags Set</span>
        </div>
      </div>
    </div>
  `;
}

// Render player response
export function renderPlayerResponse(text) {
  return `
    <div class="player-response">
      <div class="response-speaker">You</div>
      <div class="response-text">${escapeHtml(text)}</div>
    </div>
  `;
}

// Render dialogue transcript
export function renderDialogueTranscript(exchanges) {
  if (!exchanges || exchanges.length === 0) {
    return '';
  }

  const items = exchanges.map(exchange => {
    if (exchange.speaker === 'player') {
      return `
        <div class="transcript-entry transcript-player">
          <span class="transcript-speaker">You:</span>
          <span class="transcript-text">${escapeHtml(exchange.text)}</span>
        </div>
      `;
    }
    return `
      <div class="transcript-entry transcript-npc">
        <span class="transcript-speaker">${escapeHtml(exchange.speaker)}:</span>
        <span class="transcript-text">${escapeHtml(exchange.text)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="dialogue-transcript">
      ${items}
    </div>
  `;
}

// Render skip button
export function renderSkipButton() {
  return `
    <button class="dialogue-skip" data-action="skip" title="Skip to end">
      Skip ⏭️
    </button>
  `;
}

// Render NPC portrait
export function renderNpcPortrait(npcId, portraitUrl = null) {
  if (portraitUrl) {
    return `
      <div class="npc-portrait">
        <img src="${escapeHtml(portraitUrl)}" alt="${escapeHtml(npcId)}" />
      </div>
    `;
  }

  // Default placeholder portrait
  return `
    <div class="npc-portrait npc-portrait-default">
      <span class="portrait-initial">${escapeHtml(npcId.charAt(0).toUpperCase())}</span>
    </div>
  `;
}

// Get dialogue box styles
export function getDialogueStyles() {
  return `
    .dialogue-box {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 700px;
      background: linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%);
      border: 2px solid #444;
      border-radius: 12px;
      padding: 20px;
      z-index: 1000;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }

    .dialogue-content { display: flex; flex-direction: column; gap: 15px; }

    .dialogue-speaker {
      font-weight: bold;
      font-size: 18px;
      color: #FFD700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .dialogue-text {
      font-size: 16px;
      line-height: 1.6;
      color: #eee;
      min-height: 60px;
    }

    .dialogue-choices {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 10px;
    }

    .dialogue-choice {
      padding: 12px 20px;
      background: #333;
      border: 2px solid #555;
      border-radius: 8px;
      color: #fff;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .dialogue-choice:hover {
      background: #444;
      border-color: #FFD700;
      transform: translateX(5px);
    }

    .dialogue-choice:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dialogue-continue, .dialogue-end {
      padding: 10px 30px;
      background: #4CAF50;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      cursor: pointer;
      align-self: flex-end;
    }

    .dialogue-continue:hover, .dialogue-end:hover {
      background: #45a049;
    }

    .dialogue-actions {
      background: #222;
      border-radius: 8px;
      padding: 10px;
      margin-top: 10px;
    }

    .action-result {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 0;
      font-size: 14px;
      color: #8f8;
    }

    .action-result.action-take_item, .action-result.action-take_gold {
      color: #f88;
    }

    .npc-indicator {
      position: absolute;
      top: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: #FFD700;
      padding: 5px 10px;
      border-radius: 12px;
      animation: bounce 1s infinite;
    }

    .indicator-busy { background: #888; }

    @keyframes bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(-5px); }
    }

    .player-response {
      background: #1a3a5c;
      border-left: 3px solid #4a9eff;
      padding: 10px 15px;
      margin: 10px 0;
      border-radius: 0 8px 8px 0;
    }

    .response-speaker { font-weight: bold; color: #4a9eff; }
    .response-text { color: #ccc; margin-top: 5px; }

    .npc-portrait {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 3px solid #FFD700;
      overflow: hidden;
    }

    .npc-portrait-default {
      background: #444;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .portrait-initial {
      font-size: 32px;
      font-weight: bold;
      color: #FFD700;
    }

    .dialogue-skip {
      position: absolute;
      top: 10px;
      right: 10px;
      background: transparent;
      border: 1px solid #666;
      color: #888;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
    }

    .dialogue-skip:hover { border-color: #aaa; color: #aaa; }

    .dialogue-transcript {
      max-height: 200px;
      overflow-y: auto;
      padding: 10px;
      background: #222;
      border-radius: 8px;
    }

    .transcript-entry { padding: 5px 0; }
    .transcript-speaker { font-weight: bold; }
    .transcript-npc .transcript-speaker { color: #FFD700; }
    .transcript-player .transcript-speaker { color: #4a9eff; }
  `;
}
