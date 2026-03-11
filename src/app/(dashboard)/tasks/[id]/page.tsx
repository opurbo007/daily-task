import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import TaskForm from "@/components/tasks/TaskForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { PRIORITY_CONFIG, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Task" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [task, tags] = await Promise.all([
    prisma.task.findFirst({
      where: { id, userId: session.user.id },
      include: { tags: { include: { tag: true } } },
    }),
    prisma.tag.findMany({
      where: { userId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!task) notFound();

  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <div className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Tasks
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Edit Task</h1>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              priority.bg,
              priority.color
            )}
          >
            {priority.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Created {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <TaskForm tags={tags} mode="edit" task={task as any} />
    </div>
  );
}