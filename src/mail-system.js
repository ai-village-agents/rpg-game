/**
 * Mail System
 * In-game messaging with attachments and notifications
 */

// Mail types
export const MAIL_TYPES = {
  PLAYER: { id: 'player', name: 'Player Mail', retention: 30 },
  SYSTEM: { id: 'system', name: 'System Mail', retention: 7 },
  GUILD: { id: 'guild', name: 'Guild Mail', retention: 14 },
  AUCTION: { id: 'auction', name: 'Auction Mail', retention: 7 },
  REWARD: { id: 'reward', name: 'Reward Mail', retention: 30 },
  NEWSLETTER: { id: 'newsletter', name: 'Newsletter', retention: 3 }
};

// Mail priorities
export const MAIL_PRIORITIES = {
  LOW: { id: 'low', name: 'Low', sortOrder: 3 },
  NORMAL: { id: 'normal', name: 'Normal', sortOrder: 2 },
  HIGH: { id: 'high', name: 'High', sortOrder: 1 },
  URGENT: { id: 'urgent', name: 'Urgent', sortOrder: 0 }
};

// Mail status
export const MAIL_STATUS = {
  UNREAD: { id: 'unread', name: 'Unread' },
  READ: { id: 'read', name: 'Read' },
  REPLIED: { id: 'replied', name: 'Replied' },
  FORWARDED: { id: 'forwarded', name: 'Forwarded' },
  ARCHIVED: { id: 'archived', name: 'Archived' },
  DELETED: { id: 'deleted', name: 'Deleted' }
};

// Attachment types
export const ATTACHMENT_TYPES = {
  ITEM: { id: 'item', name: 'Item', maxPerMail: 5 },
  GOLD: { id: 'gold', name: 'Gold', maxPerMail: 1 },
  CURRENCY: { id: 'currency', name: 'Currency', maxPerMail: 3 }
};

/**
 * Get mail state
 */
function getMailState(state) {
  return state.mail || {
    inbox: [],
    sent: [],
    drafts: [],
    archived: [],
    deleted: [],
    folders: [],
    blocked: [],
    settings: {
      maxInbox: 100,
      autoDeleteDays: 30,
      notificationsEnabled: true
    },
    stats: {
      mailSent: 0,
      mailReceived: 0,
      attachmentsSent: 0,
      attachmentsReceived: 0
    }
  };
}

/**
 * Initialize mail state
 */
export function initMailState(state, options = {}) {
  const { maxInbox = 100, autoDeleteDays = 30 } = options;

  return {
    state: {
      ...state,
      mail: {
        inbox: [],
        sent: [],
        drafts: [],
        archived: [],
        deleted: [],
        folders: [],
        blocked: [],
        settings: {
          maxInbox,
          autoDeleteDays,
          notificationsEnabled: true
        },
        stats: {
          mailSent: 0,
          mailReceived: 0,
          attachmentsSent: 0,
          attachmentsReceived: 0
        }
      }
    },
    success: true
  };
}

/**
 * Create a mail message
 */
export function createMail(options = {}) {
  const {
    id,
    senderId,
    recipientId,
    subject = '',
    body = '',
    type = 'player',
    priority = 'normal',
    attachments = [],
    replyTo = null
  } = options;

  if (!id) {
    return { mail: null, error: 'Mail ID required' };
  }

  if (!senderId || !recipientId) {
    return { mail: null, error: 'Sender and recipient required' };
  }

  if (!subject.trim()) {
    return { mail: null, error: 'Subject required' };
  }

  const mailType = MAIL_TYPES[type.toUpperCase()];
  if (!mailType) {
    return { mail: null, error: 'Invalid mail type' };
  }

  const mailPriority = MAIL_PRIORITIES[priority.toUpperCase()];
  if (!mailPriority) {
    return { mail: null, error: 'Invalid priority' };
  }

  const mail = {
    id,
    senderId,
    recipientId,
    subject,
    body,
    type: mailType.id,
    priority: mailPriority.id,
    status: 'unread',
    attachments: attachments.slice(0, 6),
    attachmentsClaimed: false,
    replyTo,
    createdAt: Date.now(),
    readAt: null,
    expiresAt: Date.now() + (mailType.retention * 24 * 60 * 60 * 1000)
  };

  return { mail, success: true };
}

/**
 * Send mail
 */
export function sendMail(state, mail) {
  if (!mail || !mail.id) {
    return { state, success: false, error: 'Invalid mail' };
  }

  const mailState = getMailState(state);

  // Check if recipient is blocked
  if (mailState.blocked.includes(mail.senderId)) {
    return { state, success: false, error: 'Sender is blocked' };
  }

  // Check inbox capacity
  if (mailState.inbox.length >= mailState.settings.maxInbox) {
    return { state, success: false, error: 'Inbox full' };
  }

  const attachmentCount = mail.attachments?.length || 0;

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: [mail, ...mailState.inbox],
        stats: {
          ...mailState.stats,
          mailReceived: mailState.stats.mailReceived + 1,
          attachmentsReceived: mailState.stats.attachmentsReceived + attachmentCount
        }
      }
    },
    success: true,
    mail
  };
}

/**
 * Record sent mail (sender's perspective)
 */
export function recordSentMail(state, mail) {
  if (!mail || !mail.id) {
    return { state, success: false, error: 'Invalid mail' };
  }

  const mailState = getMailState(state);
  const attachmentCount = mail.attachments?.length || 0;

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        sent: [mail, ...mailState.sent.slice(0, 99)],
        stats: {
          ...mailState.stats,
          mailSent: mailState.stats.mailSent + 1,
          attachmentsSent: mailState.stats.attachmentsSent + attachmentCount
        }
      }
    },
    success: true
  };
}

/**
 * Read mail
 */
export function readMail(state, mailId) {
  const mailState = getMailState(state);
  const mailIndex = mailState.inbox.findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    return { state, success: false, error: 'Mail not found' };
  }

  const mail = mailState.inbox[mailIndex];
  const wasUnread = mail.status === 'unread';

  const updatedMail = {
    ...mail,
    status: 'read',
    readAt: wasUnread ? Date.now() : mail.readAt
  };

  const newInbox = [...mailState.inbox];
  newInbox[mailIndex] = updatedMail;

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: newInbox
      }
    },
    success: true,
    mail: updatedMail,
    wasUnread
  };
}

/**
 * Claim attachments from mail
 */
export function claimAttachments(state, mailId) {
  const mailState = getMailState(state);
  const mailIndex = mailState.inbox.findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    return { state, success: false, error: 'Mail not found' };
  }

  const mail = mailState.inbox[mailIndex];

  if (!mail.attachments || mail.attachments.length === 0) {
    return { state, success: false, error: 'No attachments' };
  }

  if (mail.attachmentsClaimed) {
    return { state, success: false, error: 'Attachments already claimed' };
  }

  const updatedMail = {
    ...mail,
    attachmentsClaimed: true
  };

  const newInbox = [...mailState.inbox];
  newInbox[mailIndex] = updatedMail;

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: newInbox
      }
    },
    success: true,
    attachments: mail.attachments
  };
}

/**
 * Delete mail
 */
export function deleteMail(state, mailId, permanent = false) {
  const mailState = getMailState(state);
  const mailIndex = mailState.inbox.findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    // Check deleted folder for permanent delete
    if (permanent) {
      const deletedIndex = mailState.deleted.findIndex(m => m.id === mailId);
      if (deletedIndex === -1) {
        return { state, success: false, error: 'Mail not found' };
      }

      return {
        state: {
          ...state,
          mail: {
            ...mailState,
            deleted: mailState.deleted.filter(m => m.id !== mailId)
          }
        },
        success: true,
        permanent: true
      };
    }
    return { state, success: false, error: 'Mail not found' };
  }

  const mail = mailState.inbox[mailIndex];

  // Move to deleted instead of permanent delete
  const updatedMail = {
    ...mail,
    status: 'deleted',
    deletedAt: Date.now()
  };

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: mailState.inbox.filter(m => m.id !== mailId),
        deleted: [updatedMail, ...mailState.deleted.slice(0, 49)]
      }
    },
    success: true,
    permanent: false
  };
}

/**
 * Archive mail
 */
export function archiveMail(state, mailId) {
  const mailState = getMailState(state);
  const mailIndex = mailState.inbox.findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    return { state, success: false, error: 'Mail not found' };
  }

  const mail = mailState.inbox[mailIndex];
  const updatedMail = {
    ...mail,
    status: 'archived',
    archivedAt: Date.now()
  };

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: mailState.inbox.filter(m => m.id !== mailId),
        archived: [updatedMail, ...mailState.archived]
      }
    },
    success: true,
    mail: updatedMail
  };
}

/**
 * Restore mail from deleted/archived
 */
export function restoreMail(state, mailId, fromFolder = 'deleted') {
  const mailState = getMailState(state);
  const folder = fromFolder === 'archived' ? 'archived' : 'deleted';
  const mailIndex = mailState[folder].findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    return { state, success: false, error: 'Mail not found' };
  }

  const mail = mailState[folder][mailIndex];
  const restoredMail = {
    ...mail,
    status: 'read'
  };

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: [restoredMail, ...mailState.inbox],
        [folder]: mailState[folder].filter(m => m.id !== mailId)
      }
    },
    success: true,
    mail: restoredMail
  };
}

/**
 * Save draft
 */
export function saveDraft(state, draft) {
  if (!draft || !draft.id) {
    return { state, success: false, error: 'Invalid draft' };
  }

  const mailState = getMailState(state);
  const existingIndex = mailState.drafts.findIndex(d => d.id === draft.id);

  const draftMail = {
    ...draft,
    status: 'draft',
    updatedAt: Date.now()
  };

  let newDrafts;
  if (existingIndex >= 0) {
    newDrafts = [...mailState.drafts];
    newDrafts[existingIndex] = draftMail;
  } else {
    newDrafts = [draftMail, ...mailState.drafts];
  }

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        drafts: newDrafts.slice(0, 20)
      }
    },
    success: true,
    draft: draftMail
  };
}

/**
 * Delete draft
 */
export function deleteDraft(state, draftId) {
  const mailState = getMailState(state);

  if (!mailState.drafts.find(d => d.id === draftId)) {
    return { state, success: false, error: 'Draft not found' };
  }

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        drafts: mailState.drafts.filter(d => d.id !== draftId)
      }
    },
    success: true
  };
}

/**
 * Block sender
 */
export function blockSender(state, senderId) {
  if (!senderId) {
    return { state, success: false, error: 'Sender ID required' };
  }

  const mailState = getMailState(state);

  if (mailState.blocked.includes(senderId)) {
    return { state, success: false, error: 'Already blocked' };
  }

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        blocked: [...mailState.blocked, senderId]
      }
    },
    success: true,
    blockedId: senderId
  };
}

/**
 * Unblock sender
 */
export function unblockSender(state, senderId) {
  const mailState = getMailState(state);

  if (!mailState.blocked.includes(senderId)) {
    return { state, success: false, error: 'Not blocked' };
  }

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        blocked: mailState.blocked.filter(id => id !== senderId)
      }
    },
    success: true,
    unblockedId: senderId
  };
}

/**
 * Create custom folder
 */
export function createFolder(state, folderName) {
  if (!folderName || !folderName.trim()) {
    return { state, success: false, error: 'Folder name required' };
  }

  const mailState = getMailState(state);

  if (mailState.folders.find(f => f.name.toLowerCase() === folderName.toLowerCase())) {
    return { state, success: false, error: 'Folder already exists' };
  }

  const folder = {
    id: `folder_${Date.now()}`,
    name: folderName.trim(),
    mails: [],
    createdAt: Date.now()
  };

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        folders: [...mailState.folders, folder]
      }
    },
    success: true,
    folder
  };
}

/**
 * Move mail to folder
 */
export function moveToFolder(state, mailId, folderId) {
  const mailState = getMailState(state);
  const mailIndex = mailState.inbox.findIndex(m => m.id === mailId);

  if (mailIndex === -1) {
    return { state, success: false, error: 'Mail not found' };
  }

  const folderIndex = mailState.folders.findIndex(f => f.id === folderId);
  if (folderIndex === -1) {
    return { state, success: false, error: 'Folder not found' };
  }

  const mail = mailState.inbox[mailIndex];
  const newFolders = [...mailState.folders];
  newFolders[folderIndex] = {
    ...newFolders[folderIndex],
    mails: [...newFolders[folderIndex].mails, mail]
  };

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: mailState.inbox.filter(m => m.id !== mailId),
        folders: newFolders
      }
    },
    success: true
  };
}

/**
 * Get inbox
 */
export function getInbox(state, options = {}) {
  const mailState = getMailState(state);
  const { type, priority, unreadOnly, sortBy = 'date' } = options;

  let mails = [...mailState.inbox];

  if (type) {
    mails = mails.filter(m => m.type === type);
  }

  if (priority) {
    mails = mails.filter(m => m.priority === priority);
  }

  if (unreadOnly) {
    mails = mails.filter(m => m.status === 'unread');
  }

  // Sort
  if (sortBy === 'priority') {
    mails.sort((a, b) => {
      const aPriority = MAIL_PRIORITIES[a.priority.toUpperCase()]?.sortOrder || 99;
      const bPriority = MAIL_PRIORITIES[b.priority.toUpperCase()]?.sortOrder || 99;
      return aPriority - bPriority;
    });
  } else {
    mails.sort((a, b) => b.createdAt - a.createdAt);
  }

  return {
    mails,
    count: mails.length,
    unreadCount: mails.filter(m => m.status === 'unread').length
  };
}

/**
 * Get sent mails
 */
export function getSentMails(state) {
  const mailState = getMailState(state);
  return [...mailState.sent];
}

/**
 * Get drafts
 */
export function getDrafts(state) {
  const mailState = getMailState(state);
  return [...mailState.drafts];
}

/**
 * Get archived mails
 */
export function getArchivedMails(state) {
  const mailState = getMailState(state);
  return [...mailState.archived];
}

/**
 * Get deleted mails
 */
export function getDeletedMails(state) {
  const mailState = getMailState(state);
  return [...mailState.deleted];
}

/**
 * Get unread count
 */
export function getUnreadCount(state) {
  const mailState = getMailState(state);
  return mailState.inbox.filter(m => m.status === 'unread').length;
}

/**
 * Get mail stats
 */
export function getMailStats(state) {
  const mailState = getMailState(state);
  return { ...mailState.stats };
}

/**
 * Get blocked list
 */
export function getBlockedList(state) {
  const mailState = getMailState(state);
  return [...mailState.blocked];
}

/**
 * Get folders
 */
export function getFolders(state) {
  const mailState = getMailState(state);
  return [...mailState.folders];
}

/**
 * Search mail
 */
export function searchMail(state, query) {
  if (!query || !query.trim()) {
    return { results: [], count: 0 };
  }

  const mailState = getMailState(state);
  const searchTerm = query.toLowerCase();

  const results = mailState.inbox.filter(mail =>
    mail.subject.toLowerCase().includes(searchTerm) ||
    mail.body.toLowerCase().includes(searchTerm) ||
    mail.senderId.toLowerCase().includes(searchTerm)
  );

  return {
    results,
    count: results.length
  };
}

/**
 * Mark all as read
 */
export function markAllAsRead(state) {
  const mailState = getMailState(state);
  const now = Date.now();

  const updatedInbox = mailState.inbox.map(mail => {
    if (mail.status === 'unread') {
      return { ...mail, status: 'read', readAt: now };
    }
    return mail;
  });

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: updatedInbox
      }
    },
    success: true
  };
}

/**
 * Update mail settings
 */
export function updateMailSettings(state, settings) {
  const mailState = getMailState(state);

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        settings: {
          ...mailState.settings,
          ...settings
        }
      }
    },
    success: true
  };
}

/**
 * Clean expired mail
 */
export function cleanExpiredMail(state) {
  const mailState = getMailState(state);
  const now = Date.now();

  const activeInbox = mailState.inbox.filter(mail =>
    !mail.expiresAt || mail.expiresAt > now
  );

  const removedCount = mailState.inbox.length - activeInbox.length;

  return {
    state: {
      ...state,
      mail: {
        ...mailState,
        inbox: activeInbox
      }
    },
    success: true,
    removedCount
  };
}
