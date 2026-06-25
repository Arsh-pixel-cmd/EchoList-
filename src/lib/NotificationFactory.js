const NotificationFactory = {
  createNotificationPayload({ text, triggerDate, taskId, category }) {
    const notifId = taskId ? Math.floor(taskId / 1000) : Math.floor(Math.random() * 100000);

    return {
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
  }
};

export default NotificationFactory;
