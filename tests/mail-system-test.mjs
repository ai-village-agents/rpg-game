/**
 * Mail System Tests
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  MAIL_TYPES,
  MAIL_PRIORITIES,
  MAIL_STATUS,
  ATTACHMENT_TYPES,
  initMailState,
  createMail,
  sendMail,
  recordSentMail,
  readMail,
  claimAttachments,
  deleteMail,
  archiveMail,
  restoreMail,
  saveDraft,
  deleteDraft,
  blockSender,
  unblockSender,
  createFolder,
  moveToFolder,
  getInbox,
  getSentMails,
  getDrafts,
  getArchivedMails,
  getDeletedMails,
  getUnreadCount,
  getMailStats,
  getBlockedList,
  getFolders,
  searchMail,
  markAllAsRead,
  updateMailSettings,
  cleanExpiredMail
} from '../src/mail-system.js';

import {
  renderMailPreview,
  renderInbox,
  renderMailView,
  renderAttachments,
  renderComposeForm,
  renderSentFolder,
  renderDraftsFolder,
  renderArchivedFolder,
  renderDeletedFolder,
  renderFolderSidebar,
  renderMailNotification,
  renderMailStats,
  renderTypeFilter,
  renderPriorityFilter,
  renderSearchBox
} from '../src/mail-system-ui.js';

describe('Mail System', () => {
  let state;

  beforeEach(() => {
    state = {};
    const result = initMailState(state);
    state = result.state;
  });

  describe('MAIL_TYPES', () => {
    it('has all types', () => {
      assert.ok(MAIL_TYPES.PLAYER);
      assert.ok(MAIL_TYPES.SYSTEM);
      assert.ok(MAIL_TYPES.GUILD);
      assert.ok(MAIL_TYPES.AUCTION);
    });

    it('has retention periods', () => {
      assert.ok(MAIL_TYPES.PLAYER.retention > 0);
      assert.ok(MAIL_TYPES.SYSTEM.retention > 0);
    });
  });

  describe('MAIL_PRIORITIES', () => {
    it('has priorities', () => {
      assert.ok(MAIL_PRIORITIES.LOW);
      assert.ok(MAIL_PRIORITIES.NORMAL);
      assert.ok(MAIL_PRIORITIES.HIGH);
      assert.ok(MAIL_PRIORITIES.URGENT);
    });
  });

  describe('initMailState', () => {
    it('creates initial state', () => {
      assert.ok(state.mail);
      assert.deepStrictEqual(state.mail.inbox, []);
      assert.deepStrictEqual(state.mail.sent, []);
    });

    it('sets max inbox', () => {
      const result = initMailState({}, { maxInbox: 50 });
      assert.strictEqual(result.state.mail.settings.maxInbox, 50);
    });
  });

  describe('createMail', () => {
    it('creates mail', () => {
      const result = createMail({
        id: 'm1',
        senderId: 'player1',
        recipientId: 'player2',
        subject: 'Hello',
        body: 'Test message'
      });
      assert.ok(result.success);
      assert.strictEqual(result.mail.subject, 'Hello');
    });

    it('fails without id', () => {
      const result = createMail({
        senderId: 'p1',
        recipientId: 'p2',
        subject: 'Test'
      });
      assert.ok(!result.success);
    });

    it('fails without subject', () => {
      const result = createMail({
        id: 'm1',
        senderId: 'p1',
        recipientId: 'p2',
        subject: ''
      });
      assert.ok(!result.success);
    });

    it('sets default type and priority', () => {
      const result = createMail({
        id: 'm1',
        senderId: 'p1',
        recipientId: 'p2',
        subject: 'Test'
      });
      assert.strictEqual(result.mail.type, 'player');
      assert.strictEqual(result.mail.priority, 'normal');
    });
  });

  describe('sendMail', () => {
    it('sends mail', () => {
      const { mail } = createMail({
        id: 'm1',
        senderId: 'p1',
        recipientId: 'p2',
        subject: 'Test'
      });
      const result = sendMail(state, mail);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 1);
    });

    it('fails when inbox full', () => {
      let s = initMailState({}, { maxInbox: 1 }).state;
      const { mail: m1 } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test1' });
      s = sendMail(s, m1).state;
      const { mail: m2 } = createMail({ id: 'm2', senderId: 'p1', recipientId: 'p2', subject: 'Test2' });
      const result = sendMail(s, m2);
      assert.ok(!result.success);
      assert.ok(result.error.includes('full'));
    });
  });

  describe('recordSentMail', () => {
    it('records sent mail', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      const result = recordSentMail(state, mail);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.sent.length, 1);
    });
  });

  describe('readMail', () => {
    it('marks mail as read', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      const result = readMail(state, 'm1');
      assert.ok(result.success);
      assert.strictEqual(result.mail.status, 'read');
      assert.ok(result.wasUnread);
    });

    it('fails for nonexistent mail', () => {
      const result = readMail(state, 'nonexistent');
      assert.ok(!result.success);
    });
  });

  describe('claimAttachments', () => {
    it('claims attachments', () => {
      const { mail } = createMail({
        id: 'm1',
        senderId: 'p1',
        recipientId: 'p2',
        subject: 'Gift',
        attachments: [{ type: 'item', itemId: 'sword1' }]
      });
      state = sendMail(state, mail).state;
      const result = claimAttachments(state, 'm1');
      assert.ok(result.success);
      assert.ok(result.attachments.length > 0);
    });

    it('fails when already claimed', () => {
      const { mail } = createMail({
        id: 'm1',
        senderId: 'p1',
        recipientId: 'p2',
        subject: 'Gift',
        attachments: [{ type: 'item', itemId: 'sword1' }]
      });
      state = sendMail(state, mail).state;
      state = claimAttachments(state, 'm1').state;
      const result = claimAttachments(state, 'm1');
      assert.ok(!result.success);
    });
  });

  describe('deleteMail', () => {
    it('moves to deleted', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      const result = deleteMail(state, 'm1');
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 0);
      assert.strictEqual(result.state.mail.deleted.length, 1);
    });

    it('permanently deletes from trash', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      state = deleteMail(state, 'm1').state;
      const result = deleteMail(state, 'm1', true);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.deleted.length, 0);
    });
  });

  describe('archiveMail', () => {
    it('archives mail', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      const result = archiveMail(state, 'm1');
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 0);
      assert.strictEqual(result.state.mail.archived.length, 1);
    });
  });

  describe('restoreMail', () => {
    it('restores from deleted', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      state = deleteMail(state, 'm1').state;
      const result = restoreMail(state, 'm1', 'deleted');
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 1);
    });

    it('restores from archived', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      state = archiveMail(state, 'm1').state;
      const result = restoreMail(state, 'm1', 'archived');
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 1);
    });
  });

  describe('saveDraft', () => {
    it('saves draft', () => {
      const draft = { id: 'd1', recipientId: 'p2', subject: 'Draft', body: 'WIP' };
      const result = saveDraft(state, draft);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.drafts.length, 1);
    });

    it('updates existing draft', () => {
      const draft = { id: 'd1', recipientId: 'p2', subject: 'Draft', body: 'WIP' };
      state = saveDraft(state, draft).state;
      const updated = { id: 'd1', recipientId: 'p2', subject: 'Updated', body: 'Changed' };
      const result = saveDraft(state, updated);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.drafts.length, 1);
      assert.strictEqual(result.state.mail.drafts[0].subject, 'Updated');
    });
  });

  describe('deleteDraft', () => {
    it('deletes draft', () => {
      const draft = { id: 'd1', recipientId: 'p2', subject: 'Draft' };
      state = saveDraft(state, draft).state;
      const result = deleteDraft(state, 'd1');
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.drafts.length, 0);
    });
  });

  describe('blockSender', () => {
    it('blocks sender', () => {
      const result = blockSender(state, 'spammer');
      assert.ok(result.success);
      assert.ok(result.state.mail.blocked.includes('spammer'));
    });

    it('fails for already blocked', () => {
      state = blockSender(state, 'spammer').state;
      const result = blockSender(state, 'spammer');
      assert.ok(!result.success);
    });
  });

  describe('unblockSender', () => {
    it('unblocks sender', () => {
      state = blockSender(state, 'user1').state;
      const result = unblockSender(state, 'user1');
      assert.ok(result.success);
      assert.ok(!result.state.mail.blocked.includes('user1'));
    });
  });

  describe('createFolder', () => {
    it('creates folder', () => {
      const result = createFolder(state, 'Important');
      assert.ok(result.success);
      assert.strictEqual(result.folder.name, 'Important');
    });

    it('fails for duplicate name', () => {
      state = createFolder(state, 'Test').state;
      const result = createFolder(state, 'test');
      assert.ok(!result.success);
    });
  });

  describe('moveToFolder', () => {
    it('moves mail to folder', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      state = createFolder(state, 'Work').state;
      const folderId = state.mail.folders[0].id;
      const result = moveToFolder(state, 'm1', folderId);
      assert.ok(result.success);
      assert.strictEqual(result.state.mail.inbox.length, 0);
    });
  });

  describe('getInbox', () => {
    it('returns inbox mails', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      const result = getInbox(state);
      assert.strictEqual(result.count, 1);
    });

    it('filters by type', () => {
      const { mail: m1 } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'T1', type: 'player' });
      const { mail: m2 } = createMail({ id: 'm2', senderId: 'system', recipientId: 'p2', subject: 'T2', type: 'system' });
      state = sendMail(state, m1).state;
      state = sendMail(state, m2).state;
      const result = getInbox(state, { type: 'player' });
      assert.strictEqual(result.count, 1);
    });
  });

  describe('getUnreadCount', () => {
    it('counts unread', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Test' });
      state = sendMail(state, mail).state;
      assert.strictEqual(getUnreadCount(state), 1);
    });
  });

  describe('searchMail', () => {
    it('searches by subject', () => {
      const { mail } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'Important Notice' });
      state = sendMail(state, mail).state;
      const result = searchMail(state, 'important');
      assert.strictEqual(result.count, 1);
    });
  });

  describe('markAllAsRead', () => {
    it('marks all as read', () => {
      const { mail: m1 } = createMail({ id: 'm1', senderId: 'p1', recipientId: 'p2', subject: 'T1' });
      const { mail: m2 } = createMail({ id: 'm2', senderId: 'p1', recipientId: 'p2', subject: 'T2' });
      state = sendMail(state, m1).state;
      state = sendMail(state, m2).state;
      state = markAllAsRead(state).state;
      assert.strictEqual(getUnreadCount(state), 0);
    });
  });
});

describe('Mail System UI', () => {
  let state;
  let mail;

  beforeEach(() => {
    state = initMailState({}).state;
    const created = createMail({
      id: 'm1',
      senderId: 'player1',
      recipientId: 'player2',
      subject: 'Test Subject',
      body: 'Test body content'
    });
    mail = created.mail;
    state = sendMail(state, mail).state;
  });

  describe('renderMailPreview', () => {
    it('renders preview', () => {
      const html = renderMailPreview(mail);
      assert.ok(html.includes('Test Subject'));
      assert.ok(html.includes('player1'));
    });

    it('shows unread class', () => {
      const html = renderMailPreview(mail);
      assert.ok(html.includes('unread'));
    });
  });

  describe('renderInbox', () => {
    it('renders inbox', () => {
      const html = renderInbox(state);
      assert.ok(html.includes('inbox'));
      assert.ok(html.includes('Test Subject'));
    });

    it('shows empty state', () => {
      const emptyState = initMailState({}).state;
      const html = renderInbox(emptyState);
      assert.ok(html.includes('No mail'));
    });
  });

  describe('renderMailView', () => {
    it('renders mail', () => {
      const html = renderMailView(mail);
      assert.ok(html.includes('Test Subject'));
      assert.ok(html.includes('Test body content'));
    });

    it('handles null', () => {
      const html = renderMailView(null);
      assert.ok(html.includes('Select a message'));
    });
  });

  describe('renderAttachments', () => {
    it('renders attachments', () => {
      const mailWithAtt = { ...mail, attachments: [{ type: 'item', itemId: 'sword1' }] };
      const html = renderAttachments(mailWithAtt);
      assert.ok(html.includes('Attachments'));
      assert.ok(html.includes('Claim'));
    });

    it('shows claimed status', () => {
      const mailWithAtt = { ...mail, attachments: [{ type: 'item', itemId: 'sword1' }], attachmentsClaimed: true };
      const html = renderAttachments(mailWithAtt);
      assert.ok(html.includes('claimed'));
    });
  });

  describe('renderComposeForm', () => {
    it('renders form', () => {
      const html = renderComposeForm();
      assert.ok(html.includes('compose-form'));
      assert.ok(html.includes('Send'));
    });

    it('fills in reply data', () => {
      const html = renderComposeForm(null, mail);
      assert.ok(html.includes('Re: Test Subject'));
      assert.ok(html.includes('player1'));
    });
  });

  describe('renderSentFolder', () => {
    it('renders sent', () => {
      state = recordSentMail(state, mail).state;
      const html = renderSentFolder(state);
      assert.ok(html.includes('Sent'));
    });
  });

  describe('renderDraftsFolder', () => {
    it('renders drafts', () => {
      state = saveDraft(state, { id: 'd1', subject: 'Draft' }).state;
      const html = renderDraftsFolder(state);
      assert.ok(html.includes('Drafts'));
      assert.ok(html.includes('Draft'));
    });
  });

  describe('renderArchivedFolder', () => {
    it('renders archived', () => {
      state = archiveMail(state, 'm1').state;
      const html = renderArchivedFolder(state);
      assert.ok(html.includes('Archived'));
    });
  });

  describe('renderDeletedFolder', () => {
    it('renders deleted', () => {
      state = deleteMail(state, 'm1').state;
      const html = renderDeletedFolder(state);
      assert.ok(html.includes('Deleted'));
      assert.ok(html.includes('Restore'));
    });
  });

  describe('renderFolderSidebar', () => {
    it('renders sidebar', () => {
      const html = renderFolderSidebar(state);
      assert.ok(html.includes('Inbox'));
      assert.ok(html.includes('Sent'));
      assert.ok(html.includes('Compose'));
    });

    it('shows unread badge', () => {
      const html = renderFolderSidebar(state);
      assert.ok(html.includes('badge'));
    });
  });

  describe('renderMailNotification', () => {
    it('renders notification', () => {
      const html = renderMailNotification(state);
      assert.ok(html.includes('mail-notification'));
      assert.ok(html.includes('has-unread'));
    });
  });

  describe('renderMailStats', () => {
    it('renders stats', () => {
      const html = renderMailStats(state);
      assert.ok(html.includes('Mail Statistics'));
      assert.ok(html.includes('Sent'));
    });
  });

  describe('renderTypeFilter', () => {
    it('renders filter', () => {
      const html = renderTypeFilter('player');
      assert.ok(html.includes('Player Mail'));
      assert.ok(html.includes('System Mail'));
    });
  });

  describe('renderPriorityFilter', () => {
    it('renders filter', () => {
      const html = renderPriorityFilter();
      assert.ok(html.includes('Normal'));
      assert.ok(html.includes('Urgent'));
    });
  });

  describe('renderSearchBox', () => {
    it('renders search', () => {
      const html = renderSearchBox();
      assert.ok(html.includes('search'));
      assert.ok(html.includes('input'));
    });
  });

  describe('XSS Prevention', () => {
    it('escapes mail subject', () => {
      const maliciousMail = createMail({
        id: 'x',
        senderId: 'p1',
        recipientId: 'p2',
        subject: '<script>alert("xss")</script>'
      });
      const html = renderMailPreview(maliciousMail.mail);
      assert.ok(!html.includes('<script>'));
      assert.ok(html.includes('&lt;script&gt;'));
    });
  });
});
