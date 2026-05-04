import { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Pencil } from "lucide-react";
import { format } from "date-fns";
import { auth } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { cn, formatMinutes, PRIORITY_CONFIG, STATUS_CONFIG } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";

export const metadata: Metadata = { title: "View Task" };

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const task = await prisma.task.findFirst({
    where: { id, userId: session.user.id },
    include: { tags: { include: { tag: true } } },
  });

  if (!task) notFound();

  const priority = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];
  const status = STATUS_CONFIG[task.status as keyof typeof STATUS_CONFIG];

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-5">
      <div>
        <Link href="/tasks" className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Tasks
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Created {format(new Date(task.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href={`/tasks/${task.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className={cn("rounded-full px-2 py-1 text-xs font-medium", priority.bg, priority.color)}>
            {priority.label} priority
          </span>
          <span className={cn("rounded-full px-2 py-1 text-xs font-medium", status.bg, status.color)}>
            {status.label}
          </span>
          {task.tags.map(({ tag }) => (
            <span key={tag.id} className="rounded-full px-2 py-1 text-xs font-medium" style={{ backgroundColor: `${tag.color}20`, color: tag.color }}>
              {tag.name}
            </span>
          ))}
        </div>

        {task.description ? (
          <div>
            <h2 className="mb-1 text-xs font-semibold text-muted-foreground">Description</h2>
            <p className="whitespace-pre-wrap text-sm">{task.description}</p>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Due date
            </div>
            <p className="text-sm">{task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy h:mm a") : "No due date"}</p>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Time
            </div>
            <p className="text-sm">
              {task.estimatedTime ? `Estimated ${formatMinutes(task.estimatedTime)}` : "No estimate"}
              {task.actualTime ? ` | Actual ${formatMinutes(task.actualTime)}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
