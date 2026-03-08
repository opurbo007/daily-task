import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  startOfDay,
  endOfDay,
  startOfTomorrow,
  endOfWeek,
  isPast,
  isToday,
} from "date-fns";
import StatsOverview from "@/components/dashboard/StatsOverview";
import TaskSection from "@/components/dashboard/TaskSection";
import ProgressCard from "@/components/dashboard/ProgressCard";
import StreakCard from "@/components/dashboard/StreakCard";
import QuickAdd from "@/components/tasks/QuickAdd";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const today = new Date();

  const [todaysTasks, overdueTasks, upcomingTasks, completedToday, user] =
    await Promise.all([
      // Today's tasks
      prisma.task.findMany({
        where: {
          userId,
          dueDate: { gte: startOfDay(today), lte: endOfDay(today) },
          status: { not: "COMPLETED" },
        },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      }),

      // Overdue tasks
      prisma.task.findMany({
        where: {
          userId,
          dueDate: { lt: startOfDay(today) },
          status: { in: ["PENDING", "IN_PROGRESS"] },
        },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        take: 10,
      }),

      // Upcoming (next 7 days)
      prisma.task.findMany({
        where: {
          userId,
          dueDate: {
            gte: startOfTomorrow(),
            lte: endOfWeek(today),
          },
          status: { not: "COMPLETED" },
        },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
        take: 10,
      }),

      // Completed today
      prisma.task.findMany({
        where: {
          userId,
          completedAt: { gte: startOfDay(today), lte: endOfDay(today) },
          status: "COMPLETED",
        },
        include: { tags: { include: { tag: true } } },
        orderBy: { completedAt: "desc" },
      }),

      // User info for streak
      prisma.user.findUnique({
        where: { id: userId },
        select: { streakCount: true, lastActiveDate: true },
      }),
    ]);

  const totalToday = todaysTasks.length + completedToday.length;
  const completionRate =
    totalToday > 0
      ? Math.round((completedToday.length / totalToday) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Add */}
      <QuickAdd />

      {/* Stats Row */}
      <StatsOverview
        todayCount={todaysTasks.length}
        overdueCount={overdueTasks.length}
        upcomingCount={upcomingTasks.length}
        completedTodayCount={completedToday.length}
      />

      {/* Progress & Streak */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <ProgressCard
            completionRate={completionRate}
            completedCount={completedToday.length}
            totalCount={totalToday}
          />
        </div>
        <StreakCard
          streakCount={user?.streakCount || 0}
          lastActiveDate={user?.lastActiveDate}
        />
      </div>

      {/* Task Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Tasks */}
        <TaskSection
          title="Today's Tasks"
          emoji="📋"
          tasks={todaysTasks as any}
          emptyMessage="No tasks due today. Enjoy your day!"
          variant="today"
        />

        {/* Overdue */}
        <TaskSection
          title="Overdue"
          emoji="⚠️"
          tasks={overdueTasks as any}
          emptyMessage="No overdue tasks. Great job staying on top!"
          variant="overdue"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming */}
        <TaskSection
          title="Upcoming"
          emoji="🗓️"
          tasks={upcomingTasks as any}
          emptyMessage="No upcoming tasks this week."
          variant="upcoming"
        />

        {/* Completed Today */}
        <TaskSection
          title="Completed Today"
          emoji="✅"
          tasks={completedToday as any}
          emptyMessage="Nothing completed yet today. Let's go!"
          variant="completed"
        />
      </div>
    </div>
  );
}
