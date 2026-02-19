import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// ── Todo Category Detection ─────────────────────────────────────────
// Analyses the text of a todo and returns a category + notification config
const CATEGORIES = [
    {
        id: 'meeting',
        keywords: ['meeting', 'call', 'zoom', 'standup', 'sync', 'interview', 'conference'],
        icon: '📞',
        label: 'Meeting',
        color: '#6366f1', // indigo
        actionTypeId: 'REMINDER',
    },
    {
        id: 'deadline',
        keywords: ['deadline', 'due', 'submit', 'deliver', 'finish', 'complete', 'ship'],
        icon: '🔥',
        label: 'Deadline',
        color: '#ef4444', // red
        actionTypeId: 'REMINDER',
    },
    {
        id: 'errand',
        keywords: ['buy', 'pick up', 'grocery', 'store', 'shop', 'order', 'pay', 'bill'],
        icon: '🛒',
        label: 'Errand',
        color: '#f59e0b', // amber
        actionTypeId: 'REMINDER',
    },
    {
        id: 'health',
        keywords: ['gym', 'workout', 'run', 'walk', 'medicine', 'doctor', 'yoga', 'meditate', 'exercise'],
        icon: '💪',
        label: 'Health',
        color: '#10b981', // emerald
        actionTypeId: 'REMINDER',
    },
    {
        id: 'social',
        keywords: ['birthday', 'party', 'dinner', 'lunch', 'hangout', 'visit', 'friends', 'family', 'mom', 'dad'],
        icon: '🎉',
        label: 'Social',
        color: '#ec4899', // pink
        actionTypeId: 'CHAT_MSG',
    },
];

const DEFAULT_CATEGORY = {
    id: 'general',
    icon: '📌',
    label: 'Task',
    color: '#64748b', // slate
    actionTypeId: 'REMINDER',
};

function detectCategory(text) {
    const lower = text.toLowerCase();
    for (const cat of CATEGORIES) {
        if (cat.keywords.some(k => lower.includes(k))) {
            return cat;
        }
    }
    return DEFAULT_CATEGORY;
}

// ── Notification History (persisted in localStorage) ────────────────
const HISTORY_KEY = 'echo_notification_history';

function getHistory() {
    try {
        const raw = localStorage.getItem(HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function pushToHistory(entry) {
    const history = getHistory();
    history.unshift(entry); // newest first
    if (history.length > 50) history.length = 50; // cap
    saveHistory(history);
}

function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

// ── Service ─────────────────────────────────────────────────────────
const NotificationService = {

    detectCategory,
    getHistory,
    clearHistory,

    async requestPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch {
            return false;
        }
    },

    async init() {
        try {
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'CHAT_MSG',
                        actions: [
                            { id: 'reply', title: 'Reply', input: true, inputPlaceholder: 'Type your reply...' },
                            { id: 'mark_read', title: 'Mark as Read', destructive: false },
                        ],
                    },
                    {
                        id: 'REMINDER',
                        actions: [
                            { id: 'snooze', title: 'Snooze 5m', destructive: false },
                            { id: 'dismiss', title: 'Dismiss', destructive: true },
                        ],
                    },
                ],
            });
        } catch (e) {
            console.error('Failed to register action types', e);
        }
    },

    // ── Smart Schedule — auto-detects category from text ───────────
    async scheduleSmartNotification({ text, triggerDate, taskId }) {
        const category = detectCategory(text);
        const notifId = taskId ? Math.floor(taskId / 1000) : Math.floor(Math.random() * 100000);

        const notification = {
            title: `${category.icon} ${category.label} Reminder`,
            body: text,
            id: notifId,
            schedule: { at: triggerDate, allowWhileIdle: true },
            sound: 'beep.wav',
            smallIcon: 'ic_launcher',
            iconColor: category.color,
            actionTypeId: category.actionTypeId,
            extra: { taskId: String(taskId), categoryId: category.id },
        };

        // Save to history
        pushToHistory({
            id: notifId,
            title: notification.title,
            body: notification.body,
            categoryId: category.id,
            icon: category.icon,
            color: category.color,
            scheduledAt: triggerDate.toISOString(),
            read: false,
        });

        if (Capacitor.isNativePlatform()) {
            try {
                await LocalNotifications.schedule({ notifications: [notification] });
            } catch (e) {
                console.error('Failed to schedule notification', e);
            }
        }

        return { notifId, category };
    },

    // ── Listeners ──────────────────────────────────────────────────
    addListeners(onReceived, onActionPerformed) {
        LocalNotifications.addListener('localNotificationReceived', (notification) => {
            if (onReceived) onReceived(notification);
        });
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
            if (onActionPerformed) onActionPerformed(action);
        });
    },

    removeAllListeners() {
        LocalNotifications.removeAllListeners();
    },
};

export default NotificationService;
