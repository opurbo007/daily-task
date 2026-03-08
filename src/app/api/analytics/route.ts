import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, endOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "14");
  const userId = session.user.id;
  const today = new Date();

  // Daily completion for last N days
  const dailyData = await Promise.all(
    Array.from({ length: days }, async (_, i) => {
      const date = subDays(today, days - 1 - i);
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
      return { date: format(date, "MMM d"), completed, created };
    })
  );

  // Priority distribution
  const priorityData = await prisma.task.groupBy({
    by: ["priority"],
    where: { userId },
    _count: true,
  });

  // Status breakdown
  const statusData = await prisma.task.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  // Overall stats
  const [total, completed, overdue] = await Promise.all([
    prisma.task.count({ where: { userId } }),
    prisma.task.count({ where: { userId, status: "COMPLETED" } }),
    prisma.task.count({
      where: {
        userId,
        status: { in: ["PENDING", "IN_PROGRESS"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  return NextResponse.json({
    dailyData,
    priorityDistribution: priorityData.map((p) => ({
      priority: p.priority,
      count: p._count,
    })),
    statusBreakdown: statusData.map((s) => ({
      status: s.status,
      count: s._count,
    })),
    stats: { total, completed, overdue, completionRate: total > 0 ? (completed / total) * 100 : 0 },
  });
}
