/**
 * Dialogue System UI
 * Rendering functions for dialogue interface
 */

import {
  NODE_TYPES,
  SPEAKER_TYPES,
  EMOTIONS,
  REQUIREMENT_TYPES,
  getCurrentNode,
  getAvailableChoices,
  getDialogueStats,
  isDialogueActive,
  getChoiceHistory
} from './dialogue-system.js';

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render dialogue box
 */
export function renderDialogueBox(state, playerStats = {}) {
  const { node, active, dialogue } = getCurrentNode(state);

  if (!active) {
    return '';
  }

  const speaker = SPEAKER_TYPES[node.speaker?.toUpperCase()] || SPEAKER_TYPES.NPC;
  const emotion = EMOTIONS[node.emotion?.toUpperCase()] || EMOTIONS.NEUTRAL;

  return `
    <div class="dialogue-box">
      <div class="dialogue-header">
        <div class="speaker-portrait ${emotion.id}">
          ${renderSpeakerIcon(node.speaker)}
        </div>
        <span class="speaker-name">${escapeHtml(dialogue.speakerId)}</span>
      </div>
      <div class="dialogue-content">
        <p class="dialogue-text">${escapeHtml(node.text)}</p>
      </div>
      ${node.type === 'choice' 
        ? renderChoices(state, playerStats) 
        : renderContinueButton()
      }
    </div>
  `;
}

/**
 * Render speaker icon
 */
function renderSpeakerIcon(speakerType) {
  const icons = {
    npc: '&#128100;',
    player: '&#128512;',
    narrator: '&#128214;',
    system: '&#9881;'
  };
  return icons[speakerType?.toLowerCase()] || icons.npc;
}

/**
 * Render dialogue choices
 */
export function renderChoices(state, playerStats = {}) {
  const { choices, hasChoices } = getAvailableChoices(state, playerStats);

  if (!hasChoices) {
    return renderContinueButton();
  }

  return `
    <div class="dialogue-choices">
      ${choices.map(choice => renderChoice(choice)).join('')}
    </div>
  `;
}

/**
 * Render a single choice
 */
export function renderChoice(choice) {
  const availableClass = choice.available ? 'available' : 'unavailable';
  
  return `
    <button class="dialogue-choice ${availableClass}" 
            data-choice-id="${escapeHtml(choice.id)}"
            ${choice.available ? '' : 'disabled'}>
      <span class="choice-text">${escapeHtml(choice.text)}</span>
      ${!choice.available && choice.requirementInfo 
        ? `<span class="requirement-hint">${renderRequirementHint(choice.requirementInfo)}</span>`
        : ''
      }
    </button>
  `;
}

/**
 * Render requirement hint
 */
export function renderRequirementHint(requirementInfo) {
  if (!requirementInfo || requirementInfo.met) {
    return '';
  }

  if (requirementInfo.required !== undefined) {
    return `(Need ${requirementInfo.required}, have ${requirementInfo.current})`;
  }

  if (requirementInfo.itemId) {
    return '(Item required)';
  }

  if (requirementInfo.questId) {
    return '(Quest incomplete)';
  }

  return '(Requirement not met)';
}

/**
 * Render continue button
 */
export function renderContinueButton() {
  return `
    <div class="dialogue-actions">
      <button class="continue-btn">Continue</button>
    </div>
  `;
}

/**
 * Render dialogue history
 */
export function renderDialogueHistory(state) {
  const history = getChoiceHistory(state);

  if (history.length === 0) {
    return '<div class="no-history">No dialogue history</div>';
  }

  return `
    <div class="dialogue-history">
      <h4>Conversation Log</h4>
      <ul>
        ${history.map(entry => `
          <li>
            <span class="node">${escapeHtml(entry.nodeId)}</span>
            <span class="choice">Choice: ${escapeHtml(entry.choiceId)}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render dialogue stats
 */
export function renderDialogueStats(state) {
  const stats = getDialogueStats(state);

  return `
    <div class="dialogue-stats">
      <h4>Dialogue Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.dialoguesStarted}</span>
          <span class="stat-label">Started</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.dialoguesCompleted}</span>
          <span class="stat-label">Completed</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.choicesMade}</span>
          <span class="stat-label">Choices Made</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render compact dialogue indicator
 */
export function renderDialogueIndicator(state) {
  const active = isDialogueActive(state);

  return `
    <div class="dialogue-indicator ${active ? 'active' : 'inactive'}">
      ${active ? '&#128172; In Conversation' : ''}
    </div>
  `;
}

/**
 * Render NPC dialogue prompt
 */
export function renderNpcPrompt(npcName, hasDialogue = true) {
  if (!hasDialogue) {
    return '';
  }

  return `
    <div class="npc-prompt">
      <span class="npc-name">${escapeHtml(npcName)}</span>
      <span class="talk-hint">Press [E] to talk</span>
    </div>
  `;
}

/**
 * Render emotion selector (for dialogue editor)
 */
export function renderEmotionSelector(selected) {
  return `
    <div class="emotion-selector">
      <h4>Speaker Emotion</h4>
      <div class="emotion-grid">
        ${Object.values(EMOTIONS).map(emotion => `
          <button class="emotion-option ${selected === emotion.id ? 'selected' : ''}"
                  data-emotion="${emotion.id}">
            ${escapeHtml(emotion.name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render speaker type selector
 */
export function renderSpeakerSelector(selected) {
  return `
    <div class="speaker-selector">
      <h4>Speaker Type</h4>
      <div class="speaker-options">
        ${Object.values(SPEAKER_TYPES).map(speaker => `
          <button class="speaker-option ${selected === speaker.id ? 'selected' : ''}"
                  data-speaker="${speaker.id}">
            ${renderSpeakerIcon(speaker.id)}
            ${escapeHtml(speaker.name)}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render node type selector
 */
export function renderNodeTypeSelector(selected) {
  return `
    <div class="node-type-selector">
      <h4>Node Type</h4>
      <select class="node-type-select">
        ${Object.values(NODE_TYPES).map(type => `
          <option value="${type.id}" ${selected === type.id ? 'selected' : ''}>
            ${escapeHtml(type.name)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render requirement type selector
 */
export function renderRequirementSelector(selected) {
  return `
    <div class="requirement-selector">
      <h4>Requirement Type</h4>
      <select class="requirement-select">
        ${Object.values(REQUIREMENT_TYPES).map(req => `
          <option value="${req.id}" ${selected === req.id ? 'selected' : ''}>
            ${escapeHtml(req.name)}
          </option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render typewriter effect text
 */
export function renderTypewriterText(text, charIndex) {
  const visibleText = text.substring(0, charIndex);
  const hiddenText = text.substring(charIndex);

  return `
    <span class="typewriter-visible">${escapeHtml(visibleText)}</span>
    <span class="typewriter-hidden">${escapeHtml(hiddenText)}</span>
    <span class="typewriter-cursor">|</span>
  `;
}

/**
 * Render skip button
 */
export function renderSkipButton() {
  return `
    <button class="skip-dialogue-btn" title="Skip to choices">
      Skip &#9658;&#9658;
    </button>
  `;
}
