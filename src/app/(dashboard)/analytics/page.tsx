import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import AnalyticsClient from "@/components/analytics/AnalyticsClient";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const today = new Date();

  // Last 14 days of data
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(today, 13 - i);
    return { date, label: format(date, "MMM d") };
  });

  const dailyData = await Promise.all(
    last14Days.map(async ({ date, label }) => {
      const [created, completed] = await Promise.all([
        prisma.task.count({
          where: {
            userId,
            createdAt: { gte: startOfDay(date), lte: endOfDay(date) },
          },
        }),
        prisma.task.count({
          where: {
            userId,
            completedAt: { gte: startOfDay(date), lte: endOfDay(date) },
            status: "COMPLETED",
          },
        }),
      ]);
      return { date: label, completed, created };
    })
  );

  // Priority distribution
  const priorityData = await prisma.task.groupBy({
    by: ["priority"],
    where: { userId },
    _count: true,
  });

  const PRIORITY_COLORS = {
    LOW: "#22c55e",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
    CRITICAL: "#dc2626",
  };

  const priorityDistribution = priorityData.map((p) => ({
    priority: p.priority.charAt(0) + p.priority.slice(1).toLowerCase(),
    count: p._count,
    color: PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS],
  }));

  // Status breakdown
  const statusData = await prisma.task.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  const statusBreakdown = statusData.map((s) => ({
    status: s.status.replace("_", " ").charAt(0) + s.status.replace("_", " ").slice(1).toLowerCase(),
    count: s._count,
  }));

  // Overall stats
  const totalTasks = await prisma.task.count({ where: { userId } });
  const completedTasks = await prisma.task.count({
    where: { userId, status: "COMPLETED" },
  });
  const overdueTasks = await prisma.task.count({
    where: {
      userId,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      dueDate: { lt: new Date() },
    },
  });

  return (
    <AnalyticsClient
      dailyData={dailyData}
      priorityDistribution={priorityDistribution}
      statusBreakdown={statusBreakdown}
      totalTasks={totalTasks}
      completedTasks={completedTasks}
      overdueTasks={overdueTasks}
    />
  );
}
