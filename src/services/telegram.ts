import type { Task, WeeklyReport } from "@/types";
import { format } from "date-fns";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId: string, text: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

export function formatPriorityEmoji(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: "🚨",
    HIGH: "🔥",
    MEDIUM: "⚡",
    LOW: "📌",
  };
  return map[priority] || "📌";
}

export async function sendDailyReminder(
  chatId: string,
  tasks: Task[]
): Promise<boolean> {
  const today = format(new Date(), "EEEE, MMMM d");
  const pending = tasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS"
  );

  const grouped = pending.reduce(
    (acc, task) => {
      acc[task.priority] = acc[task.priority] || [];
      acc[task.priority].push(task);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  let message = `📋 <b>Daily Task Reminder</b>\n`;
  message += `📅 ${today}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `You have <b>${pending.length} tasks</b> today\n\n`;

  const priorityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  for (const priority of priorityOrder) {
    const items = grouped[priority];
    if (!items?.length) continue;

    message += `${formatPriorityEmoji(priority)} <b>${priority.charAt(0) + priority.slice(1).toLowerCase()} Priority</b>\n`;
    items.forEach((task) => {
      const time = task.estimatedTime
        ? ` (${task.estimatedTime}min)`
        : "";
      message += `  • ${task.title}${time}\n`;
    });
    message += "\n";
  }

  message += `\n🎯 <i>Stay focused. You've got this!</i>`;
  message += `\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Open TaskMaster →</a>`;

  return sendMessage(chatId, message);
}

export async function sendOverdueAlert(
  chatId: string,
  tasks: Task[]
): Promise<boolean> {
  if (tasks.length === 0) return true;

  let message = `⚠️ <b>Overdue Task Alert</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `You have <b>${tasks.length} overdue task${tasks.length > 1 ? "s" : ""}</b>:\n\n`;

  tasks.forEach((task) => {
    const daysOverdue = task.dueDate
      ? Math.floor(
          (Date.now() - new Date(task.dueDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;
    message += `${formatPriorityEmoji(task.priority)} <b>${task.title}</b>\n`;
    message += `   ⏰ ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue\n\n`;
  });

  message += `<a href="${process.env.NEXT_PUBLIC_APP_URL}/tasks?filter=overdue">View Overdue Tasks →</a>`;

  return sendMessage(chatId, message);
}

export async function sendTaskDueReminder(
  chatId: string,
  task: Task
): Promise<boolean> {
  const dueIn = task.dueDate
    ? Math.ceil(
        (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60)
      )
    : null;

  let message = `⏰ <b>Task Due Reminder</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `${formatPriorityEmoji(task.priority)} <b>${task.title}</b>\n`;
  if (task.description) message += `📝 ${task.description}\n`;
  if (dueIn !== null) {
    message += `⌛ Due in <b>${dueIn} hour${dueIn !== 1 ? "s" : ""}</b>\n`;
  }
  message += `\n<a href="${process.env.NEXT_PUBLIC_APP_URL}/tasks/${task.id}">View Task →</a>`;

  return sendMessage(chatId, message);
}

export async function sendWeeklyReport(
  chatId: string,
  report: WeeklyReport
): Promise<boolean> {
  const weekStart = format(new Date(report.weekStart), "MMM d");
  const weekEnd = format(new Date(report.weekEnd), "MMM d, yyyy");
  const rate = Math.round(report.completionRate);
  const rateBar = generateProgressBar(rate);

  let message = `📊 <b>Weekly Productivity Report</b>\n`;
  message += `📅 ${weekStart} – ${weekEnd}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  message += `📋 Tasks Created: <b>${report.totalCreated}</b>\n`;
  message += `✅ Tasks Completed: <b>${report.totalCompleted}</b>\n`;
  message += `⚠️ Overdue: <b>${report.overdueCount}</b>\n\n`;

  message += `📈 <b>Completion Rate: ${rate}%</b>\n`;
  message += `${rateBar}\n\n`;

  if (report.mostProductiveDay) {
    message += `🏆 Most Productive: <b>${report.mostProductiveDay}</b>\n\n`;
  }

  if (report.dailyBreakdown.length > 0) {
    message += `📆 <b>Daily Breakdown:</b>\n`;
    report.dailyBreakdown.forEach((day) => {
      message += `  ${format(new Date(day.date), "EEE")}: ${day.completed}/${day.created} tasks\n`;
    });
    message += "\n";
  }

  // Motivational message based on rate
  if (rate >= 90) message += `🎉 <i>Outstanding week! You're on fire!</i>`;
  else if (rate >= 70)
    message += `💪 <i>Great week! Keep pushing forward!</i>`;
  else if (rate >= 50)
    message += `📈 <i>Solid progress. Room to grow next week!</i>`;
  else message += `🎯 <i>Every step counts. Let's do better next week!</i>`;

  message += `\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL}/analytics">View Full Analytics →</a>`;

  return sendMessage(chatId, message);
}

function generateProgressBar(percentage: number): string {
  const filled = Math.round(percentage / 10);
  const empty = 10 - filled;
  return "█".repeat(filled) + "░".repeat(empty) + ` ${percentage}%`;
}

export { sendMessage };
