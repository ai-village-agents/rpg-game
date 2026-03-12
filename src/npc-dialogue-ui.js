/**
 * NPC Dialogue UI Components
 * Renders dialogue boxes, NPC portraits, and choices
 */

import {
  NPC_DATA,
  NODE_TYPES,
  getNpcData,
  getCurrentNode,
  getDialogueHistory,
  getNpcRelation,
  hasTalkedTo,
  isDialogueActive,
} from './npc-dialogue.js';

/**
 * Get CSS styles for dialogue system
 * @returns {string} CSS styles
 */
export function getDialogueStyles() {
  return `
.dialogue-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 700px;
  z-index: 1000;
}

.dialogue-box {
  background: linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%);
  border: 2px solid #3a3a5e;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.dialogue-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid #333;
}

.dialogue-portrait {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border: 2px solid #4a4a7e;
}

.dialogue-speaker-info {
  flex: 1;
}

.dialogue-speaker-name {
  font-size: 18px;
  font-weight: bold;
  color: #e8e8ff;
  margin-bottom: 2px;
}

.dialogue-speaker-type {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.dialogue-relation {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #aaa;
}

.relation-bar {
  width: 60px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.relation-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.relation-fill.positive { background: linear-gradient(90deg, #4a8 0%, #8f8 100%); }
.relation-fill.negative { background: linear-gradient(90deg, #a44 0%, #f88 100%); }
.relation-fill.neutral { background: #666; }

.dialogue-content {
  padding: 20px;
  min-height: 80px;
}

.dialogue-text {
  font-size: 16px;
  line-height: 1.6;
  color: #ddd;
  margin-bottom: 15px;
}

.dialogue-text .speaker-label {
  color: #8af;
  font-weight: bold;
}

.dialogue-choices {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 15px;
}

.dialogue-choice {
  padding: 12px 16px;
  background: rgba(100, 100, 150, 0.2);
  border: 1px solid #444;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #ccc;
  text-align: left;
  transition: all 0.2s ease;
}

.dialogue-choice:hover {
  background: rgba(100, 100, 200, 0.3);
  border-color: #666;
  color: #fff;
}

.dialogue-choice:active {
  transform: scale(0.98);
}

.dialogue-choice-number {
  display: inline-block;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  text-align: center;
  line-height: 24px;
  margin-right: 10px;
  font-weight: bold;
  color: #8af;
}

.dialogue-continue {
  text-align: center;
  margin-top: 15px;
}

.dialogue-continue-btn {
  padding: 10px 30px;
  background: linear-gradient(90deg, #3a5a8a 0%, #4a6a9a 100%);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialogue-continue-btn:hover {
  background: linear-gradient(90deg, #4a6a9a 0%, #5a7aaa 100%);
}

.dialogue-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  background: rgba(200, 50, 50, 0.3);
  border: 1px solid #a44;
  border-radius: 50%;
  color: #f88;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.dialogue-close-btn:hover {
  background: rgba(200, 50, 50, 0.5);
}

/* NPC list styles */
.npc-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.npc-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #333;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.npc-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #555;
}

.npc-card-portrait {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(100, 100, 150, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.npc-card-info {
  flex: 1;
}

.npc-card-name {
  font-size: 14px;
  font-weight: bold;
  color: #e8e8e8;
}

.npc-card-type {
  font-size: 11px;
  color: #888;
  text-transform: capitalize;
}

.npc-card-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.npc-card-indicator.has-quest { background: #ffd700; }
.npc-card-indicator.talked { background: #4a8; }
.npc-card-indicator.new { background: #48a; }

/* Dialogue history styles */
.dialogue-history {
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  margin-bottom: 15px;
}

.history-entry {
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 13px;
  color: #aaa;
}

.history-entry:last-child {
  border-bottom: none;
}

.history-speaker {
  color: #8af;
  font-weight: bold;
}

/* NPC nameplate (for world view) */
.npc-nameplate {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
}

.npc-nameplate-icon {
  font-size: 16px;
}

.npc-nameplate.quest-giver { border-left: 3px solid #ffd700; }
.npc-nameplate.merchant { border-left: 3px solid #4a8; }
.npc-nameplate.trainer { border-left: 3px solid #a4f; }
`;
}

/**
 * Render dialogue box
 * @param {Object} dialogueState - Dialogue state
 * @param {Object} gameState - Full game state (for conditions)
 * @returns {string} HTML string
 */
export function renderDialogueBox(dialogueState, gameState = null) {
  if (!isDialogueActive(dialogueState)) {
    return '';
  }

  const current = getCurrentNode(dialogueState);
  if (!current) {
    return '';
  }

  const { node, npc } = current;
  if (!npc) {
    return '';
  }

  const relation = getNpcRelation(dialogueState, npc.id);
  const relationClass = relation > 0 ? 'positive' : relation < 0 ? 'negative' : 'neutral';
  const relationWidth = Math.abs(relation) / 2;

  let contentHtml = '';

  if (node.type === NODE_TYPES.TEXT || node.type === NODE_TYPES.ACTION) {
    const speakerName = node.speaker === 'player' ? 'You' : npc.name;
    contentHtml = `
      <div class="dialogue-text">
        <span class="speaker-label">${escapeHtml(speakerName)}:</span> ${escapeHtml(node.text || '')}
      </div>
      <div class="dialogue-continue">
        <button class="dialogue-continue-btn" data-action="continue">Continue \u25B6</button>
      </div>
    `;
  } else if (node.type === NODE_TYPES.CHOICE) {
    const choicesHtml = node.choices.map((choice, index) => `
      <button class="dialogue-choice" data-action="choice" data-index="${index}">
        <span class="dialogue-choice-number">${index + 1}</span>
        ${escapeHtml(choice.text)}
      </button>
    `).join('');

    contentHtml = `
      <div class="dialogue-text">
        ${node.text ? escapeHtml(node.text) : 'Choose your response:'}
      </div>
      <div class="dialogue-choices">
        ${choicesHtml}
      </div>
    `;
  } else if (node.type === NODE_TYPES.END) {
    contentHtml = `
      <div class="dialogue-text">
        <em>End of conversation</em>
      </div>
      <div class="dialogue-continue">
        <button class="dialogue-continue-btn" data-action="end">Close</button>
      </div>
    `;
  }

  return `
    <div class="dialogue-container">
      <div class="dialogue-box">
        <button class="dialogue-close-btn" data-action="close" aria-label="Close">\u00D7</button>
        <div class="dialogue-header">
          <div class="dialogue-portrait">${escapeHtml(npc.portrait)}</div>
          <div class="dialogue-speaker-info">
            <div class="dialogue-speaker-name">${escapeHtml(npc.name)}</div>
            <div class="dialogue-speaker-type">${escapeHtml(npc.type.replace('-', ' '))}</div>
          </div>
          <div class="dialogue-relation">
            <span>\u2764\uFE0F</span>
            <div class="relation-bar">
              <div class="relation-fill ${relationClass}" style="width: ${relationWidth}%"></div>
            </div>
          </div>
        </div>
        <div class="dialogue-content">
          ${contentHtml}
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render NPC greeting (before starting dialogue)
 * @param {string} npcId - NPC ID
 * @returns {string} HTML string
 */
export function renderNpcGreeting(npcId) {
  const npc = getNpcData(npcId);
  if (!npc) {
    return '<div class="npc-greeting">NPC not found</div>';
  }

  return `
    <div class="dialogue-container">
      <div class="dialogue-box">
        <div class="dialogue-header">
          <div class="dialogue-portrait">${escapeHtml(npc.portrait)}</div>
          <div class="dialogue-speaker-info">
            <div class="dialogue-speaker-name">${escapeHtml(npc.name)}</div>
            <div class="dialogue-speaker-type">${escapeHtml(npc.type.replace('-', ' '))}</div>
          </div>
        </div>
        <div class="dialogue-content">
          <div class="dialogue-text">${escapeHtml(npc.greeting)}</div>
          <div class="dialogue-choices">
            <button class="dialogue-choice" data-action="talk" data-npc="${escapeHtml(npc.id)}">
              <span class="dialogue-choice-number">1</span>
              Talk to ${escapeHtml(npc.name)}
            </button>
            <button class="dialogue-choice" data-action="leave">
              <span class="dialogue-choice-number">2</span>
              Leave
            </button>
          </div>
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Render NPC list (for location view)
 * @param {Array} npcs - Array of NPC data
 * @param {Object} dialogueState - Dialogue state
 * @returns {string} HTML string
 */
export function renderNpcList(npcs, dialogueState = null) {
  if (!npcs || npcs.length === 0) {
    return '<div class="npc-list-empty">No one here</div>';
  }

  const npcsHtml = npcs.map(npc => {
    const talked = dialogueState ? hasTalkedTo(dialogueState, npc.id) : false;
    const indicatorClass = talked ? 'talked' : 'new';

    return `
      <div class="npc-card" data-npc="${escapeHtml(npc.id)}">
        <div class="npc-card-portrait">${escapeHtml(npc.portrait)}</div>
        <div class="npc-card-info">
          <div class="npc-card-name">${escapeHtml(npc.name)}</div>
          <div class="npc-card-type">${escapeHtml(npc.type.replace('-', ' '))}</div>
        </div>
        <div class="npc-card-indicator ${indicatorClass}"></div>
      </div>
    `;
  }).join('');

  return `
    <div class="npc-list">
      ${npcsHtml}
    </div>
  `.trim();
}

/**
 * Render dialogue history
 * @param {Object} dialogueState - Dialogue state
 * @param {number} limit - Max entries
 * @returns {string} HTML string
 */
export function renderDialogueHistory(dialogueState, limit = 5) {
  const history = getDialogueHistory(dialogueState, limit);

  if (history.length === 0) {
    return '';
  }

  const entriesHtml = history.map(entry => {
    const speakerName = entry.speaker === 'player' ? 'You' : getNpcData(entry.speaker)?.name || entry.speaker;
    return `
      <div class="history-entry">
        <span class="history-speaker">${escapeHtml(speakerName)}:</span>
        ${escapeHtml(entry.text || '')}
      </div>
    `;
  }).join('');

  return `
    <div class="dialogue-history">
      ${entriesHtml}
    </div>
  `.trim();
}

/**
 * Render NPC nameplate (for world view)
 * @param {string} npcId - NPC ID
 * @returns {string} HTML string
 */
export function renderNpcNameplate(npcId) {
  const npc = getNpcData(npcId);
  if (!npc) {
    return '';
  }

  return `
    <div class="npc-nameplate ${escapeHtml(npc.type)}">
      <span class="npc-nameplate-icon">${escapeHtml(npc.portrait)}</span>
      <span>${escapeHtml(npc.name)}</span>
    </div>
  `.trim();
}

/**
 * Render interaction prompt
 * @param {string} npcId - NPC ID
 * @returns {string} HTML string
 */
export function renderInteractionPrompt(npcId) {
  const npc = getNpcData(npcId);
  if (!npc) {
    return '';
  }

  return `
    <div class="interaction-prompt">
      Press <kbd>E</kbd> to talk to ${escapeHtml(npc.name)}
    </div>
  `.trim();
}

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
