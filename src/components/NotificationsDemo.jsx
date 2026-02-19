import React, { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';

const NotificationsDemo = () => {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [logs, setLogs] = useState([]);

    const addLog = (msg) => setLogs(prev => [msg, ...prev]);

    useEffect(() => {
        // Init logic
        NotificationService.init();

        // Listeners
        NotificationService.addListeners(
            (notification) => {
                addLog(`Received: ${notification.title} (ID: ${notification.id})`);
                if (notification.extra) {
                    addLog(`Extra Data: ${JSON.stringify(notification.extra)}`);
                }
            },
            (action) => {
                addLog(`Action: ${action.actionId} (Input: ${action.inputValue || 'N/A'})`);
            }
        );

        return () => {
            NotificationService.removeAllListeners();
        };
    }, []);

    const handleRequestPermissions = async () => {
        const granted = await NotificationService.requestPermissions();
        setPermissionGranted(granted);
        addLog(`Permission: ${granted ? 'GRANTED' : 'DENIED'}`);
    };

    const handleBasic = () => {
        NotificationService.scheduleBasic({
            title: "Fresh Notification",
            body: "This is a basic notification from the demo."
        });
        addLog("Scheduled Basic (1s delay)");
    };

    const handleActionable = () => {
        NotificationService.scheduleActionable({
            title: "Task Reminder",
            body: "Do you want to snooze this task?",
            actionTypeId: 'REMINDER'
        });
        addLog("Scheduled Actionable (1s delay)");
    };

    const handleChat = () => {
        NotificationService.scheduleActionable({
            title: "New Message",
            body: "Hei! How are you doing?",
            actionTypeId: 'CHAT_MSG'
        });
        addLog("Scheduled Chat w/ Reply (1s delay)");
    };

    const handleRecurring = () => {
        NotificationService.scheduleRecurring({
            title: "Recurring Ping",
            body: "This happens every minute (at :10s)"
        });
        addLog("Scheduled Recurring");
    };

    return (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md max-w-md mx-auto mt-4">
            <h2 className="text-xl font-bold mb-4 text-center">🔔 Notification Crazy Demo</h2>

            <div className="space-y-3">
                <button
                    onClick={handleRequestPermissions}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                    1. Request Permissions
                </button>

                <div className={`p-2 text-center rounded ${permissionGranted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    Status: {permissionGranted ? "Ready" : "Not Granted"}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleBasic} disabled={!permissionGranted}
                        className="bg-gray-200 dark:bg-gray-700 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
                    >
                        Basic
                    </button>
                    <button
                        onClick={handleActionable} disabled={!permissionGranted}
                        className="bg-indigo-100 text-indigo-800 py-2 rounded hover:bg-indigo-200 disabled:opacity-50"
                    >
                        Action Buttons
                    </button>
                    <button
                        onClick={handleChat} disabled={!permissionGranted}
                        className="bg-purple-100 text-purple-800 py-2 rounded hover:bg-purple-200 disabled:opacity-50"
                    >
                        Inline Reply
                    </button>
                    <button
                        onClick={handleRecurring} disabled={!permissionGranted}
                        className="bg-orange-100 text-orange-800 py-2 rounded hover:bg-orange-200 disabled:opacity-50"
                    >
                        Recurring
                    </button>
                </div>
            </div>

            <div className="mt-6 border-t pt-2">
                <h3 className="text-sm font-semibold mb-2">Logs:</h3>
                <div className="bg-black text-green-400 p-2 text-xs h-32 overflow-y-auto rounded font-mono">
                    {logs.length === 0 ? <span className="opacity-50">Waiting for events...</span> : logs.map((log, i) => (
                        <div key={i}>&gt; {log}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationsDemo;
