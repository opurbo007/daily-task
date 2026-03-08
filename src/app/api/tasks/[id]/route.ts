import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  estimatedTime: z.number().positive().optional().nullable(),
  actualTime: z.number().positive().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  sortOrder: z.number().optional(),
  completedAt: z.string().optional().nullable(),
});

async function getTaskAndVerify(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  return task;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getTaskAndVerify(params.id, session.user.id);
  if (!existing)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { tagIds, dueDate, completedAt, ...data } = parsed.data;

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...data,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      completedAt:
        completedAt !== undefined
          ? completedAt
            ? new Date(completedAt)
            : null
          : data.status === "COMPLETED"
          ? new Date()
          : undefined,
      tags: tagIds !== undefined
        ? {
            deleteMany: {},
            create: tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(task);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getTaskAndVerify(params.id, session.user.id);
  if (!existing)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const { completedAt, dueDate, ...rest } = body;

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(completedAt !== undefined && {
        completedAt: completedAt ? new Date(completedAt) : null,
      }),
    },
    include: { tags: { include: { tag: true } } },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await getTaskAndVerify(params.id, session.user.id);
  if (!existing)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
