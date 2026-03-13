/**
 * Mail System UI
 * Rendering functions for mail interface
 */

import {
  MAIL_TYPES,
  MAIL_PRIORITIES,
  MAIL_STATUS,
  ATTACHMENT_TYPES,
  getInbox,
  getSentMails,
  getDrafts,
  getArchivedMails,
  getDeletedMails,
  getUnreadCount,
  getMailStats,
  getFolders
} from './mail-system.js';

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
 * Format timestamp
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get priority icon
 */
function getPriorityIcon(priority) {
  const icons = {
    urgent: '&#128308;',
    high: '&#128992;',
    normal: '&#128309;',
    low: '&#9898;'
  };
  return icons[priority] || icons.normal;
}

/**
 * Get type icon
 */
function getTypeIcon(type) {
  const icons = {
    player: '&#128100;',
    system: '&#9881;',
    guild: '&#127984;',
    auction: '&#128176;',
    reward: '&#127873;',
    newsletter: '&#128240;'
  };
  return icons[type] || icons.player;
}

/**
 * Render mail preview
 */
export function renderMailPreview(mail) {
  if (!mail) return '';

  const isUnread = mail.status === 'unread';
  const hasAttachments = mail.attachments && mail.attachments.length > 0;
  const attachmentsPending = hasAttachments && !mail.attachmentsClaimed;

  return `
    <div class="mail-preview ${isUnread ? 'unread' : ''}" data-mail-id="${escapeHtml(mail.id)}">
      <div class="mail-priority">${getPriorityIcon(mail.priority)}</div>
      <div class="mail-type">${getTypeIcon(mail.type)}</div>
      <div class="mail-sender">${escapeHtml(mail.senderId)}</div>
      <div class="mail-subject">${escapeHtml(mail.subject)}</div>
      ${hasAttachments ? `<span class="attachment-icon" title="${mail.attachments.length} attachment(s)${attachmentsPending ? ' (unclaimed)' : ''}">&#128206;</span>` : ''}
      <div class="mail-date">${formatDate(mail.createdAt)}</div>
    </div>
  `;
}

/**
 * Render inbox
 */
export function renderInbox(state, options = {}) {
  const { mails, count, unreadCount } = getInbox(state, options);

  if (count === 0) {
    return `
      <div class="inbox empty">
        <p>No mail</p>
      </div>
    `;
  }

  return `
    <div class="inbox">
      <div class="inbox-header">
        <span class="mail-count">${count} messages</span>
        ${unreadCount > 0 ? `<span class="unread-count">${unreadCount} unread</span>` : ''}
      </div>
      <div class="mail-list">
        ${mails.map(mail => renderMailPreview(mail)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render full mail view
 */
export function renderMailView(mail) {
  if (!mail) {
    return '<div class="mail-view empty">Select a message to read</div>';
  }

  const type = MAIL_TYPES[mail.type.toUpperCase()];
  const priority = MAIL_PRIORITIES[mail.priority.toUpperCase()];

  return `
    <div class="mail-view" data-mail-id="${escapeHtml(mail.id)}">
      <div class="mail-header">
        <h3 class="mail-subject">${escapeHtml(mail.subject)}</h3>
        <div class="mail-meta">
          <span class="mail-from">From: ${escapeHtml(mail.senderId)}</span>
          <span class="mail-date">${formatDate(mail.createdAt)}</span>
          <span class="mail-type">${escapeHtml(type?.name || mail.type)}</span>
          <span class="mail-priority">${getPriorityIcon(mail.priority)} ${escapeHtml(priority?.name || mail.priority)}</span>
        </div>
      </div>
      <div class="mail-body">
        <p>${escapeHtml(mail.body).replace(/\n/g, '<br>')}</p>
      </div>
      ${renderAttachments(mail)}
      <div class="mail-actions">
        <button class="action-btn reply" data-action="reply">Reply</button>
        <button class="action-btn forward" data-action="forward">Forward</button>
        <button class="action-btn archive" data-action="archive">Archive</button>
        <button class="action-btn delete" data-action="delete">Delete</button>
      </div>
    </div>
  `;
}

/**
 * Render attachments
 */
export function renderAttachments(mail) {
  if (!mail.attachments || mail.attachments.length === 0) {
    return '';
  }

  return `
    <div class="mail-attachments">
      <h4>Attachments (${mail.attachments.length})</h4>
      <div class="attachment-list">
        ${mail.attachments.map(att => `
          <div class="attachment-item">
            <span class="attachment-type">${escapeHtml(att.type)}</span>
            <span class="attachment-name">${escapeHtml(att.name || att.itemId || 'Item')}</span>
            ${att.quantity ? `<span class="attachment-qty">x${att.quantity}</span>` : ''}
          </div>
        `).join('')}
      </div>
      ${!mail.attachmentsClaimed
        ? '<button class="claim-btn" data-action="claim">Claim Attachments</button>'
        : '<span class="claimed-notice">Attachments claimed</span>'
      }
    </div>
  `;
}

/**
 * Render compose form
 */
export function renderComposeForm(draft = null, replyTo = null) {
  const subject = draft?.subject || (replyTo ? `Re: ${replyTo.subject}` : '');
  const body = draft?.body || '';
  const recipient = draft?.recipientId || (replyTo ? replyTo.senderId : '');

  return `
    <div class="compose-form">
      <h3>${replyTo ? 'Reply' : (draft ? 'Edit Draft' : 'New Message')}</h3>
      <div class="form-group">
        <label>To:</label>
        <input type="text" name="recipient" value="${escapeHtml(recipient)}" placeholder="Recipient ID">
      </div>
      <div class="form-group">
        <label>Subject:</label>
        <input type="text" name="subject" value="${escapeHtml(subject)}" placeholder="Subject">
      </div>
      <div class="form-group">
        <label>Priority:</label>
        <select name="priority">
          ${Object.values(MAIL_PRIORITIES).map(p => `
            <option value="${escapeHtml(p.id)}" ${draft?.priority === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Message:</label>
        <textarea name="body" rows="6" placeholder="Write your message...">${escapeHtml(body)}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn send" data-action="send">Send</button>
        <button class="btn save-draft" data-action="save-draft">Save Draft</button>
        <button class="btn cancel" data-action="cancel">Cancel</button>
      </div>
    </div>
  `;
}

/**
 * Render sent folder
 */
export function renderSentFolder(state) {
  const mails = getSentMails(state);

  if (mails.length === 0) {
    return '<div class="sent-folder empty">No sent messages</div>';
  }

  return `
    <div class="sent-folder">
      <h3>Sent (${mails.length})</h3>
      <div class="mail-list">
        ${mails.map(mail => `
          <div class="mail-preview" data-mail-id="${escapeHtml(mail.id)}">
            <div class="mail-recipient">To: ${escapeHtml(mail.recipientId)}</div>
            <div class="mail-subject">${escapeHtml(mail.subject)}</div>
            <div class="mail-date">${formatDate(mail.createdAt)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render drafts folder
 */
export function renderDraftsFolder(state) {
  const drafts = getDrafts(state);

  if (drafts.length === 0) {
    return '<div class="drafts-folder empty">No drafts</div>';
  }

  return `
    <div class="drafts-folder">
      <h3>Drafts (${drafts.length})</h3>
      <div class="mail-list">
        ${drafts.map(draft => `
          <div class="mail-preview draft" data-draft-id="${escapeHtml(draft.id)}">
            <div class="mail-recipient">To: ${escapeHtml(draft.recipientId || 'No recipient')}</div>
            <div class="mail-subject">${escapeHtml(draft.subject || 'No subject')}</div>
            <div class="mail-date">${formatDate(draft.updatedAt)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render archived folder
 */
export function renderArchivedFolder(state) {
  const mails = getArchivedMails(state);

  if (mails.length === 0) {
    return '<div class="archived-folder empty">No archived messages</div>';
  }

  return `
    <div class="archived-folder">
      <h3>Archived (${mails.length})</h3>
      <div class="mail-list">
        ${mails.map(mail => renderMailPreview(mail)).join('')}
      </div>
    </div>
  `;
}

/**
 * Render deleted folder
 */
export function renderDeletedFolder(state) {
  const mails = getDeletedMails(state);

  if (mails.length === 0) {
    return '<div class="deleted-folder empty">Trash is empty</div>';
  }

  return `
    <div class="deleted-folder">
      <h3>Deleted (${mails.length})</h3>
      <div class="mail-list">
        ${mails.map(mail => `
          <div class="mail-preview deleted" data-mail-id="${escapeHtml(mail.id)}">
            ${renderMailPreview(mail)}
            <button class="restore-btn" data-action="restore">Restore</button>
          </div>
        `).join('')}
      </div>
      <button class="empty-trash-btn" data-action="empty-trash">Empty Trash</button>
    </div>
  `;
}

/**
 * Render folder sidebar
 */
export function renderFolderSidebar(state, activeFolder = 'inbox') {
  const unreadCount = getUnreadCount(state);
  const draftsCount = getDrafts(state).length;
  const customFolders = getFolders(state);

  return `
    <div class="folder-sidebar">
      <button class="compose-btn" data-action="compose">&#9998; Compose</button>
      <ul class="folder-list">
        <li class="${activeFolder === 'inbox' ? 'active' : ''}" data-folder="inbox">
          &#128229; Inbox ${unreadCount > 0 ? `<span class="badge">${unreadCount}</span>` : ''}
        </li>
        <li class="${activeFolder === 'sent' ? 'active' : ''}" data-folder="sent">
          &#128228; Sent
        </li>
        <li class="${activeFolder === 'drafts' ? 'active' : ''}" data-folder="drafts">
          &#128221; Drafts ${draftsCount > 0 ? `<span class="badge">${draftsCount}</span>` : ''}
        </li>
        <li class="${activeFolder === 'archived' ? 'active' : ''}" data-folder="archived">
          &#128451; Archived
        </li>
        <li class="${activeFolder === 'deleted' ? 'active' : ''}" data-folder="deleted">
          &#128465; Deleted
        </li>
      </ul>
      ${customFolders.length > 0 ? `
        <h4>Custom Folders</h4>
        <ul class="custom-folders">
          ${customFolders.map(f => `
            <li class="${activeFolder === f.id ? 'active' : ''}" data-folder="${escapeHtml(f.id)}">
              &#128193; ${escapeHtml(f.name)} <span class="badge">${f.mails.length}</span>
            </li>
          `).join('')}
        </ul>
      ` : ''}
      <button class="new-folder-btn" data-action="new-folder">+ New Folder</button>
    </div>
  `;
}

/**
 * Render mail notification badge
 */
export function renderMailNotification(state) {
  const unreadCount = getUnreadCount(state);

  if (unreadCount === 0) {
    return '<div class="mail-notification">&#128231;</div>';
  }

  return `
    <div class="mail-notification has-unread">
      &#128231;
      <span class="notification-badge">${unreadCount > 99 ? '99+' : unreadCount}</span>
    </div>
  `;
}

/**
 * Render mail stats
 */
export function renderMailStats(state) {
  const stats = getMailStats(state);

  return `
    <div class="mail-stats">
      <h4>Mail Statistics</h4>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">${stats.mailSent}</span>
          <span class="stat-label">Sent</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.mailReceived}</span>
          <span class="stat-label">Received</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.attachmentsSent}</span>
          <span class="stat-label">Items Sent</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">${stats.attachmentsReceived}</span>
          <span class="stat-label">Items Received</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render type filter
 */
export function renderTypeFilter(selectedType) {
  return `
    <div class="type-filter">
      <select name="type-filter">
        <option value="">All Types</option>
        ${Object.values(MAIL_TYPES).map(type => `
          <option value="${escapeHtml(type.id)}" ${selectedType === type.id ? 'selected' : ''}>${escapeHtml(type.name)}</option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render priority filter
 */
export function renderPriorityFilter(selectedPriority) {
  return `
    <div class="priority-filter">
      <select name="priority-filter">
        <option value="">All Priorities</option>
        ${Object.values(MAIL_PRIORITIES).map(p => `
          <option value="${escapeHtml(p.id)}" ${selectedPriority === p.id ? 'selected' : ''}>${escapeHtml(p.name)}</option>
        `).join('')}
      </select>
    </div>
  `;
}

/**
 * Render search box
 */
export function renderSearchBox() {
  return `
    <div class="mail-search">
      <input type="text" name="search" placeholder="Search mail...">
      <button class="search-btn">&#128269;</button>
    </div>
  `;
}
