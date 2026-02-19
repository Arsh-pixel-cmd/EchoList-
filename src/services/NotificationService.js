import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const NotificationService = {
    // 1. Request Permissions
    async requestPermissions() {
        try {
            const result = await LocalNotifications.requestPermissions();
            return result.display === 'granted';
        } catch (e) {
            console.error("Permission request failed", e);
            return false;
        }
    },

    // 2. Initialize / Register Action Types
    async init() {
        try {
            // Define Action Types
            await LocalNotifications.registerActionTypes({
                types: [
                    {
                        id: 'CHAT_MSG',
                        actions: [
                            {
                                id: 'reply',
                                title: 'Reply',
                                input: true, // Allows user to type a reply
                                inputPlaceholder: 'Type your reply...',
                            },
                            {
                                id: 'mark_read',
                                title: 'Mark as Read',
                                destructive: false,
                            }
                        ]
                    },
                    {
                        id: 'REMINDER',
                        actions: [
                            {
                                id: 'snooze',
                                title: 'Snooze 5m',
                                destructive: false,
                            },
                            {
                                id: 'dismiss',
                                title: 'Dismiss',
                                destructive: true, // Red text on iOS
                            }
                        ]
                    }
                ]
            });
            console.log("Notification Action Types Registered");
        } catch (e) {
            console.error("Failed to register action types", e);
        }
    },

    // 3. Schedule a Basic Notification
    async scheduleBasic({ title, body, id = null }) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: title || "Hello!",
                    body: body || "This is a basic notification.",
                    id: id || Math.floor(Math.random() * 100000),
                    schedule: { at: new Date(Date.now() + 1000) }, // 1 sec delay to ensure it triggers
                    sound: "beep.wav",
                    attachments: null,
                    actionTypeId: "",
                    extra: null
                }
            ]
        });
    },

    // 4. Schedule with Actions and Logic
    async scheduleActionable({ title, body, actionTypeId }) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: title || "Action Required",
                    body: body || "Please choose an action below.",
                    id: Math.floor(Math.random() * 100000),
                    schedule: { at: new Date(Date.now() + 1000) },
                    actionTypeId: actionTypeId || 'REMINDER',
                    extra: {
                        customData: "This is some hidden data"
                    }
                }
            ]
        });
    },

    // 5. Schedule Repeatedly
    async scheduleRecurring({ title, body }) {
        await LocalNotifications.schedule({
            notifications: [
                {
                    title: title || "Recurring Task",
                    body: body || "This runs every minute.",
                    id: 999, // Fixed ID to prevent spamming duplicates
                    schedule: {
                        on: {
                            // every: 'minute' // TOO NOISY for demo, using a simple interval object or recurring structure if needed
                            // For demonstration, let's just do a one-off aimed at 5 seconds from now
                            second: (new Date().getSeconds() + 10) % 60
                        },
                        repeats: true
                    }
                }
            ]
        });
    },

    // 6. Setup Listeners
    addListeners(onReceived, onActionPerformed) {
        LocalNotifications.addListener('localNotificationReceived', (notification) => {
            console.log('Notification Received:', notification);
            if (onReceived) onReceived(notification);
        });

        LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
            console.log('Action Performed:', notificationAction);
            // actionId: 'tap' (default), 'reply', 'dismiss', etc.
            // inputValue: text typed by user if input: true
            if (onActionPerformed) onActionPerformed(notificationAction);
        });
    },

    removeAllListeners() {
        LocalNotifications.removeAllListeners();
    }
};

export default NotificationService;
