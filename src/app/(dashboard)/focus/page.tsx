import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { startOfDay, endOfDay } from "date-fns";
import FocusModeClient from "@/components/tasks/FocusModeClient";

export const metadata: Metadata = { title: "Focus Mode" };

export default async function FocusModePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const today = new Date();

  const topTasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["PENDING", "IN_PROGRESS"] },
      OR: [
        { dueDate: { lte: endOfDay(today) } },
        { priority: { in: ["CRITICAL", "HIGH"] } },
      ],
    },
    include: { tags: { include: { tag: true } } },
    orderBy: [{ priority: "desc" }, { dueDate: "asc" }, { sortOrder: "asc" }],
    take: 5,
  });

  return <FocusModeClient tasks={topTasks as any} />;
}
