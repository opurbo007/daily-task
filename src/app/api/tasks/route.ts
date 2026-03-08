import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  estimatedTime: z.number().positive().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const priority = searchParams.get("priority");
  const status = searchParams.get("status");
  const tagId = searchParams.get("tagId");

  const where: any = { userId: session.user.id };
  if (priority && priority !== "ALL") where.priority = priority;
  if (status && status !== "ALL") where.status = status;
  if (tagId) where.tags = { some: { tagId } };

  const tasks = await prisma.task.findMany({
    where,
    include: { tags: { include: { tag: true } } },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tagIds, dueDate, ...data } = parsed.data;

  // Get max sortOrder
  const lastTask = await prisma.task.findFirst({
    where: { userId: session.user.id },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: dueDate ? new Date(dueDate) : null,
      completedAt: data.status === "COMPLETED" ? new Date() : null,
      userId: session.user.id,
      sortOrder: (lastTask?.sortOrder ?? -1) + 1,
      tags: tagIds?.length
        ? {
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  // Update streak
  await updateStreak(session.user.id);

  return NextResponse.json(task, { status: 201 });
}

async function updateStreak(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streakCount: true, lastActiveDate: true },
  });

  if (!user) return;

  const today = new Date();
  const lastActive = user.lastActiveDate;
  const isYesterday =
    lastActive &&
    Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    ) === 1;
  const isToday =
    lastActive &&
    Math.floor(
      (today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    ) === 0;

  await prisma.user.update({
    where: { id: userId },
    data: {
      lastActiveDate: today,
      streakCount: isToday
        ? user.streakCount
        : isYesterday
        ? user.streakCount + 1
        : 1,
    },
  });
}
