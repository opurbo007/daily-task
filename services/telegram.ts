import { format } from "date-fns";
import type { Task, WeeklyReport } from "../types";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function appUrl(path = "") {
  return `${process.env.NEXT_PUBLIC_APP_URL || ""}${path}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function sendMessage(chatId: string, text: string): Promise<boolean> {
  console.log("sendMessage called:", chatId, text?.slice(0, 50));

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("Missing TELEGRAM_BOT_TOKEN");
    return false;
  }

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

    const responseText = await response.text();
    console.log("Telegram response:", response.status, responseText.slice(0, 200));

    if (!response.ok) {
      console.error("Telegram API error:", responseText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send Telegram message:", error);
    return false;
  }
}

async function setBotCommands(): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;

  try {
    const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "tasks", description: "Show all open tasks" },
          { command: "today", description: "Show today's tasks" },
          { command: "priority", description: "Show priority tasks" },
          { command: "fitness", description: "Show fitness exercises" },
          { command: "help", description: "Show command help" },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to set Telegram commands:", error);
    return false;
  }
}

export function formatPriorityEmoji(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: "[!]",
    HIGH: "[H]",
    MEDIUM: "[M]",
    LOW: "[L]",
  };
  return map[priority] || "[ ]";
}

export function formatTaskList(title: string, tasks: Task[], emptyMessage: string) {
  if (tasks.length === 0) return `<b>${escapeHtml(title)}</b>\n\n${escapeHtml(emptyMessage)}`;

  const lines = tasks.slice(0, 20).map((task, index) => {
    const due = task.dueDate ? ` | due ${format(new Date(task.dueDate), "MMM d, h:mm a")}` : "";
    const time = task.estimatedTime ? ` | ${task.estimatedTime}m` : "";
    return `${index + 1}. ${formatPriorityEmoji(task.priority)} <b>${escapeHtml(task.title)}</b>${due}${time}\n${appUrl(`/tasks/${task.id}`)}`;
  });

  return `<b>${escapeHtml(title)}</b>\n\n${lines.join("\n\n")}`;
}

export async function sendDailyReminder(chatId: string, tasks: Task[]): Promise<boolean> {
  const pending = tasks.filter((task) => task.status === "PENDING" || task.status === "IN_PROGRESS");
  let message = formatTaskList("Daily Task Reminder", pending, "No pending tasks for today.");
  message += `\n\n<a href="${appUrl("/dashboard")}">Open TaskMaster</a>`;
  return sendMessage(chatId, message);
}

export async function sendOverdueAlert(chatId: string, tasks: Task[]): Promise<boolean> {
  let message = formatTaskList("Overdue Task Alert", tasks, "No overdue tasks.");
  message += `\n\n<a href="${appUrl("/tasks?filter=overdue")}">View overdue tasks</a>`;
  return sendMessage(chatId, message);
}

export async function sendTaskDueReminder(chatId: string, task: Task): Promise<boolean> {
  const dueIn = task.dueDate
    ? Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60))
    : null;

  let message = `<b>Task Due Reminder</b>\n\n`;
  message += `${formatPriorityEmoji(task.priority)} <b>${escapeHtml(task.title)}</b>\n`;
  if (task.description) message += `${escapeHtml(task.description)}\n`;
  if (dueIn !== null) message += `Due in ${dueIn} hour${dueIn === 1 ? "" : "s"}\n`;
  message += `\n<a href="${appUrl(`/tasks/${task.id}`)}">View task</a>`;

  return sendMessage(chatId, message);
}

export async function sendWeeklyReport(chatId: string, report: WeeklyReport): Promise<boolean> {
  const weekStart = format(new Date(report.weekStart), "MMM d");
  const weekEnd = format(new Date(report.weekEnd), "MMM d, yyyy");
  const rate = Math.round(report.completionRate);

  let message = `<b>Weekly Productivity Report</b>\n`;
  message += `${weekStart} - ${weekEnd}\n\n`;
  message += `Tasks created: <b>${report.totalCreated}</b>\n`;
  message += `Tasks completed: <b>${report.totalCompleted}</b>\n`;
  message += `Overdue: <b>${report.overdueCount}</b>\n`;
  message += `Completion rate: <b>${rate}%</b>\n`;
  if (report.mostProductiveDay) message += `Most productive: <b>${escapeHtml(report.mostProductiveDay)}</b>\n`;
  message += `\n<a href="${appUrl("/analytics")}">View analytics</a>`;

  return sendMessage(chatId, message);
}

export { sendMessage, setBotCommands, escapeHtml };
