import cron from "node-cron";
import { prisma } from "@/lib/prisma";
import {
  sendDailyReminder,
  sendOverdueAlert,
  sendWeeklyReport,
  sendTaskDueReminder,
} from "@/services/telegram";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, subDays } from "date-fns";

let initialized = false;

export function initCronJobs() {
  if (initialized) return;
  initialized = true;

  console.log("🕐 Initializing cron jobs...");

  // Daily morning reminder — 8:00 AM every day
  cron.schedule("0 8 * * *", async () => {
    console.log("📨 Running daily reminder job...");
    await runDailyReminderJob();
  });

  // Overdue check — every 2 hours
  cron.schedule("0 */2 * * *", async () => {
    console.log("⚠️ Running overdue check job...");
    await runOverdueCheckJob();
  });

  // Task due-soon reminder — every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏰ Running due-soon reminder job...");
    await runDueSoonReminderJob();
  });

  // Weekly report — Sunday at 9:00 PM
  cron.schedule("0 21 * * 0", async () => {
    console.log("📊 Running weekly report job...");
    await runWeeklyReportJob();
  });

  console.log("✅ Cron jobs initialized");
}

export async function runDailyReminderJob() {
  const users = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      notificationSettings: { path: ["dailyReminder"], equals: true },
    },
  });

  for (const user of users) {
    if (!user.telegramChatId) continue;

    const today = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        OR: [
          { dueDate: { gte: startOfDay(today), lte: endOfDay(today) } },
          { dueDate: null },
        ],
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
    });

    if (tasks.length > 0) {
      await sendDailyReminder(user.telegramChatId, tasks as any);

      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Daily Reminder Sent",
          message: `Your daily task reminder with ${tasks.length} tasks was sent to Telegram.`,
          type: "REMINDER",
        },
      });
    }
  }
}

export async function runOverdueCheckJob() {
  const users = await prisma.user.findMany({
    where: {
      telegramChatId: { not: null },
      notificationSettings: { path: ["overdueAlert"], equals: true },
    },
  });

  for (const user of users) {
    if (!user.telegramChatId) continue;

    const overdueTasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: new Date() },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: { priority: "desc" },
    });

    if (overdueTasks.length > 0) {
      await sendOverdueAlert(user.telegramChatId, overdueTasks as any);
    }
  }
}

export async function runDueSoonReminderJob() {
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const oneHourFromNow = new Date(Date.now() + 1 * 60 * 60 * 1000);

  const tasks = await prisma.task.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { gte: oneHourFromNow, lte: twoHoursFromNow },
      reminderSent: false,
      user: { telegramChatId: { not: null } },
    },
    include: {
      user: true,
      tags: { include: { tag: true } },
    },
  });

  for (const task of tasks) {
    if (!task.user.telegramChatId) continue;

    await sendTaskDueReminder(task.user.telegramChatId, task as any);
    await prisma.task.update({
      where: { id: task.id },
      data: { reminderSent: true },
    });
  }
}

export async function runWeeklyReportJob() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const users = await prisma.user.findMany({
    where: { telegramChatId: { not: null } },
  });

  for (const user of users) {
    if (!user.telegramChatId) continue;

    // Get all tasks for the week
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: weekStart, lte: weekEnd },
      },
    });

    const completed = tasks.filter((t) => t.status === "COMPLETED");
    const overdue = tasks.filter(
      (t) =>
        t.status !== "COMPLETED" &&
        t.dueDate &&
        new Date(t.dueDate) < new Date()
    );
    const completionRate =
      tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

    // Calculate daily breakdown
    const dailyBreakdown = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dayTasks = tasks.filter(
        (t) =>
          format(new Date(t.createdAt), "yyyy-MM-dd") ===
          format(day, "yyyy-MM-dd")
      );
      const dayCompleted = dayTasks.filter((t) => t.status === "COMPLETED");
      dailyBreakdown.push({
        date: format(day, "yyyy-MM-dd"),
        created: dayTasks.length,
        completed: dayCompleted.length,
      });
    }

    // Find most productive day
    const mostProductiveDay = dailyBreakdown.reduce((best, day) =>
      day.completed > best.completed ? day : best
    );
    const mostProductiveDayName =
      mostProductiveDay.completed > 0
        ? format(new Date(mostProductiveDay.date), "EEEE")
        : null;

    // Save report to DB
    const report = await prisma.weeklyReport.create({
      data: {
        userId: user.id,
        weekStart,
        weekEnd,
        totalCreated: tasks.length,
        totalCompleted: completed.length,
        completionRate,
        mostProductiveDay: mostProductiveDayName,
        overdueCount: overdue.length,
        dailyBreakdown: dailyBreakdown as any,
      },
    });

    // Send to Telegram
    const sent = await sendWeeklyReport(user.telegramChatId, report as any);
    if (sent) {
      await prisma.weeklyReport.update({
        where: { id: report.id },
        data: { sentToTelegram: true },
      });
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Weekly Report Generated",
        message: `Your weekly report for ${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")} is ready.`,
        type: "REPORT",
      },
    });
  }
}
