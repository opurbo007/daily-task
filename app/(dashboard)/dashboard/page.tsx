import { Metadata } from "next";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfTomorrow,
  endOfWeek,
} from "date-fns";
import StatsOverview from "../../../components/dashboard/StatsOverview";
import TaskSection from "../../../components/dashboard/TaskSection";
import ProgressCard from "../../../components/dashboard/ProgressCard";
import StreakCard from "../../../components/dashboard/StreakCard";
import QuickAdd from "../../../components/tasks/QuickAdd";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const tomorrowStart = startOfTomorrow();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  const [dashboardTasks, user] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        OR: [
          { dueDate: { lt: todayStart }, status: { in: ["PENDING", "IN_PROGRESS"] } },
          { dueDate: { gte: todayStart, lte: weekEnd }, status: { not: "COMPLETED" } },
          { completedAt: { gte: todayStart, lte: todayEnd }, status: "COMPLETED" },
        ],
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { sortOrder: "asc" }],
      take: 60,
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, lastActiveDate: true },
    }),
  ]);

  const isOpen = (status: string) => status === "PENDING" || status === "IN_PROGRESS";
  const byPriority = (a: any, b: any) => b.priority.localeCompare(a.priority) || a.sortOrder - b.sortOrder;

  const todaysTasks = dashboardTasks
    .filter((task) => task.dueDate && task.dueDate >= todayStart && task.dueDate <= todayEnd && task.status !== "COMPLETED")
    .sort(byPriority)
    .slice(0, 5);
  const overdueTasks = dashboardTasks
    .filter((task) => task.dueDate && task.dueDate < todayStart && isOpen(task.status))
    .sort((a, b) => b.priority.localeCompare(a.priority) || Number(a.dueDate) - Number(b.dueDate))
    .slice(0, 5);
  const upcomingTasks = dashboardTasks
    .filter((task) => task.dueDate && task.dueDate >= tomorrowStart && task.dueDate <= weekEnd && task.status !== "COMPLETED")
    .slice(0, 5);
  const completedToday = dashboardTasks
    .filter((task) => task.completedAt && task.completedAt >= todayStart && task.completedAt <= todayEnd && task.status === "COMPLETED")
    .sort((a, b) => Number(b.completedAt) - Number(a.completedAt))
    .slice(0, 5);
  const fitnessTasks = dashboardTasks
    .filter((task) =>
      task.dueDate &&
      task.dueDate >= weekStart &&
      task.dueDate <= weekEnd &&
      task.tags.some(({ tag }) => tag.name === "Fitness")
    )
    .slice(0, 5);

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

      <TaskSection
        title="Fitness This Week"
        emoji="Fitness"
        tasks={fitnessTasks as any}
        emptyMessage="No fitness exercises planned this week."
        variant="upcoming"
      />
    </div>
  );
}
