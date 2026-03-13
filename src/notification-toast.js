/**
 * Notification toast system for the RPG game UI.
 * Provides styles, rendering helpers, and state management utilities for toasts.
 */

export const NOTIFICATION_TYPES = Object.freeze({
  ITEM_PICKUP: 'ITEM_PICKUP',
  QUEST_UPDATE: 'QUEST_UPDATE',
  REPUTATION_CHANGE: 'REPUTATION_CHANGE',
  WEATHER_CHANGE: 'WEATHER_CHANGE',
  COMPANION_EVENT: 'COMPANION_EVENT',
  LEVEL_UP: 'LEVEL_UP',
  DANGER_WARNING: 'DANGER_WARNING',
  SYSTEM_MESSAGE: 'SYSTEM_MESSAGE',
});

const TYPE_STYLES = Object.freeze({
  [NOTIFICATION_TYPES.ITEM_PICKUP]: {
    border: '#46c46a',
  },
  [NOTIFICATION_TYPES.QUEST_UPDATE]: {
    border: '#3a8ad8',
  },
  [NOTIFICATION_TYPES.REPUTATION_CHANGE]: {
    border: '#d6b44c',
  },
  [NOTIFICATION_TYPES.WEATHER_CHANGE]: {
    border: '#8a8f9a',
  },
  [NOTIFICATION_TYPES.COMPANION_EVENT]: {
    border: '#9b59d4',
  },
  [NOTIFICATION_TYPES.LEVEL_UP]: {
    border: '#f2d34f',
  },
  [NOTIFICATION_TYPES.DANGER_WARNING]: {
    border: '#e05252',
  },
  [NOTIFICATION_TYPES.SYSTEM_MESSAGE]: {
    border: '#ffffff',
  },
});

const DEFAULT_DURATION = 4000;
const MAX_VISIBLE = 5;

const ICONS = Object.freeze({
  [NOTIFICATION_TYPES.ITEM_PICKUP]: '🎒',
  [NOTIFICATION_TYPES.QUEST_UPDATE]: '📜',
  [NOTIFICATION_TYPES.REPUTATION_CHANGE]: '⭐',
  [NOTIFICATION_TYPES.WEATHER_CHANGE]: '☁️',
  [NOTIFICATION_TYPES.COMPANION_EVENT]: '🤝',
  [NOTIFICATION_TYPES.LEVEL_UP]: '⬆️',
  [NOTIFICATION_TYPES.DANGER_WARNING]: '⚠️',
  [NOTIFICATION_TYPES.SYSTEM_MESSAGE]: '🗨️',
});

const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const resolveNotificationType = (type) => (
  TYPE_STYLES[type] ? type : NOTIFICATION_TYPES.SYSTEM_MESSAGE
);

const resolvePriority = (priority) => (
  PRIORITIES.has(priority) ? priority : 'normal'
);

export function getNotificationToastStyles() {
  return `
.notification-toasts {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 280px;
  z-index: 9000;
  pointer-events: none;
  font-family: inherit;
}

.notification-toast {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(20, 20, 30, 0.95);
  border-radius: 6px;
  border-left: 4px solid var(--toast-border, #ffffff);
  color: #f1f3f7;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.35);
  animation: toast-slide-in 220ms ease-out;
  pointer-events: auto;
}

.notification-toast__icon {
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.notification-toast__message {
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 2px;
}

.notification-toast__detail {
  font-size: 12px;
  color: #c9ced8;
  line-height: 1.3;
}

.notification-toast--expiring {
  animation: toast-fade-out 260ms ease-in forwards;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(24px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toast-fade-out {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(12px);
  }
}
`;
}

export function createNotification(type, message, options = {}) {
  const now = typeof options.timestamp === 'number' ? options.timestamp : Date.now();
  const resolvedType = resolveNotificationType(type);

  return {
    id: options.id || `toast_${now}_${Math.random().toString(36).slice(2, 8)}`,
    type: resolvedType,
    message: message || '',
    detail: options.detail || '',
    icon: options.icon || ICONS[resolvedType] || '🗨️',
    timestamp: now,
    duration: typeof options.duration === 'number' ? options.duration : DEFAULT_DURATION,
    priority: resolvePriority(options.priority || 'normal'),
  };
}

export function addNotification(state, notification) {
  const notifications = Array.isArray(state.notifications) ? state.notifications : [];
  return {
    ...state,
    notifications: [...notifications, notification],
  };
}

export function expireNotifications(state, currentTime = Date.now()) {
  const notifications = Array.isArray(state.notifications) ? state.notifications : [];
  const active = notifications.filter((toast) => (
    typeof toast.duration !== 'number' || currentTime - toast.timestamp < toast.duration
  ));

  return {
    ...state,
    notifications: active,
  };
}

export function renderNotificationToasts(state) {
  const notifications = Array.isArray(state.notifications) ? state.notifications : [];
  const visible = notifications
    .slice()
    .sort((a, b) => {
      if (a.timestamp === b.timestamp) {
        return 0;
      }
      return b.timestamp - a.timestamp;
    })
    .slice(0, MAX_VISIBLE);

  if (visible.length === 0) {
    return '';
  }

  const now = Date.now();

  const toastsHtml = visible.map((toast) => {
    const type = resolveNotificationType(toast.type);
    const style = TYPE_STYLES[type] || TYPE_STYLES[NOTIFICATION_TYPES.SYSTEM_MESSAGE];
    const isExpiring = typeof toast.duration === 'number'
      && now - toast.timestamp >= Math.max(toast.duration - 280, toast.duration * 0.85);
    const safeMessage = escapeHtml(toast.message || '');
    const safeDetail = escapeHtml(toast.detail || '');

    return `
  <div class="notification-toast${isExpiring ? ' notification-toast--expiring' : ''}" style="--toast-border: ${style.border};" role="status" aria-live="polite">
    <div class="notification-toast__icon">${escapeHtml(toast.icon || '')}</div>
    <div>
      <div class="notification-toast__message">${safeMessage}</div>
      ${safeDetail ? `<div class="notification-toast__detail">${safeDetail}</div>` : ''}
    </div>
  </div>`;
  }).join('');

  return `
<div class="notification-toasts" aria-live="polite">
${toastsHtml}
</div>`;
}
