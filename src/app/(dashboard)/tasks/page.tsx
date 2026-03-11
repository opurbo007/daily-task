import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TasksClient from "@/components/tasks/TasksClient";

export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const filters = await searchParams;

  const [tasks, tags] = await Promise.all([
    prisma.task.findMany({
      where: { userId },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } }),
  ]);

  return <TasksClient tasks={tasks as any} tags={tags} initialFilters={filters} />;
}