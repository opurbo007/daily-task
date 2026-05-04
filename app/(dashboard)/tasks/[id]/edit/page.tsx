import { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { auth } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { cn, PRIORITY_CONFIG } from "../../../../../lib/utils";
import TaskForm from "../../../../../components/tasks/TaskForm";

export const metadata: Metadata = { title: "Edit Task" };

export default async function EditTaskPage({
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
          href={`/tasks/${task.id}`}
          className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to View
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">Edit Task</h1>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", priority.bg, priority.color)}>
            {priority.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Created {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <TaskForm tags={tags} mode="edit" task={task as any} />
    </div>
  );
}
