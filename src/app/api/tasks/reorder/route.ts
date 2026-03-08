import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { updates } = await req.json();

  if (!Array.isArray(updates)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Verify all tasks belong to user
  const taskIds = updates.map((u: any) => u.id);
  const tasks = await prisma.task.findMany({
    where: { id: { in: taskIds }, userId: session.user.id },
    select: { id: true },
  });

  if (tasks.length !== taskIds.length) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Batch update
  await prisma.$transaction(
    updates.map(({ id, sortOrder }: { id: string; sortOrder: number }) =>
      prisma.task.update({
        where: { id },
        data: { sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
