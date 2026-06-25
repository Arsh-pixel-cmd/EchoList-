import * as chrono from 'chrono-node';
import NotificationService from '../services/NotificationService';

const TaskFactory = {
  createTask(text, source = "Desktop") {
    const parsedDate = chrono.parseDate(text);
    let reminderTime = null;

    const category = NotificationService.detectCategory(text);
    let meta = source === "Mobile"
      ? "Synced via smartphone bridge"
      : `${category.icon} ${category.label} · Captured via studio terminal`;

    if (parsedDate) {
      const d = new Date(parsedDate);
      d.setMinutes(d.getMinutes() - 5);
      reminderTime = d.toISOString();
      const timeStr = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      meta = `${category.icon} ${category.label} · Reminder at ${timeStr}`;
    }

    return {
      id: Date.now(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source,
      meta,
      reminderTime,
      reminderSent: false,
      categoryId: category.id,
    };
  }
};

export default TaskFactory;
