"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn, PRIORITY_CONFIG, STATUS_CONFIG, formatDueDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskSectionProps {
  title: string;
  emoji: string;
  tasks: Task[];
  emptyMessage: string;
  variant: "today" | "overdue" | "upcoming" | "completed";
}

const variantStyles = {
  today: "border-blue-500/20",
  overdue: "border-red-500/20",
  upcoming: "border-amber-500/20",
  completed: "border-green-500/20",
};

export default function TaskSection({
  title,
  emoji,
  tasks,
  emptyMessage,
  variant,
}: TaskSectionProps) {
  return (
    <div
      className={cn(
        "glass rounded-xl border p-4 animate-fade-in",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <span>{emoji}</span>
          <span>{title}</span>
          {tasks.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({tasks.length})
            </span>
          )}
        </h3>
        {tasks.length > 3 && (
          <Link
            href="/tasks"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          tasks.slice(0, 5).map((task) => {
            const priority = PRIORITY_CONFIG[task.priority];
            const overdue = isOverdue(task.dueDate, task.status);

            return (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                  "hover:bg-accent/50 transition-colors duration-150",
                  "priority-" + task.priority.toLowerCase(),
                  task.status === "COMPLETED" && "opacity-60"
                )}
              >
                {/* Priority indicator */}
                <div
                  className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    task.priority === "CRITICAL" && "bg-red-600",
                    task.priority === "HIGH" && "bg-red-500",
                    task.priority === "MEDIUM" && "bg-amber-500",
                    task.priority === "LOW" && "bg-green-500"
                  )}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      task.status === "COMPLETED" && "line-through text-muted-foreground"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.dueDate && (
                    <p
                      className={cn(
                        "text-[10px] mt-0.5",
                        overdue ? "text-red-400" : "text-muted-foreground"
                      )}
                    >
                      {formatDueDate(task.dueDate)}
                    </p>
                  )}
                </div>

                {/* Tags */}
                {task.tags.length > 0 && (
                  <div className="flex gap-1 shrink-0">
                    {task.tags.slice(0, 2).map(({ tag }) => (
                      <span
                        key={tag.id}
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: tag.color + "20",
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
