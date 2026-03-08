"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { cn, PRIORITY_CONFIG, formatDueDate, isOverdue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import type { Task } from "@/types";

interface FocusModeClientProps {
  tasks: Task[];
}

export default function FocusModeClient({ tasks: initialTasks }: FocusModeClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const { toast } = useToast();

  const currentTask = tasks[currentIndex];
  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;

  async function handleComplete(taskId: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: "COMPLETED" as any } : t
      )
    );

    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          completedAt: new Date().toISOString(),
        }),
      });
      toast({ title: "🎉 Task crushed!", description: "Moving to next..." });
      setTimeout(() => {
        if (currentIndex < tasks.length - 1) {
          setCurrentIndex((i) => i + 1);
        }
      }, 800);
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  }

  return (
    <div className="min-h-full flex flex-col animate-fade-in focus-spotlight">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
          <Zap className="h-4 w-4" />
          Focus Mode
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Top 5 Priority Tasks
        </h1>
        <p className="text-muted-foreground text-sm">
          {completedCount}/{tasks.length} completed today
        </p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8 max-w-xl mx-auto w-full">
        {tasks.map((task, i) => (
          <button
            key={task.id}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "flex-1 h-2 rounded-full transition-all",
              task.status === "COMPLETED"
                ? "bg-green-500"
                : i === currentIndex
                ? "bg-primary"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-6xl">🎉</p>
          <h2 className="text-xl font-bold">All caught up!</h2>
          <p className="text-muted-foreground text-sm">
            No high-priority tasks right now.
          </p>
          <Button asChild>
            <Link href="/tasks">View All Tasks</Link>
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center">
          {/* Task cards list */}
          <div className="w-full max-w-xl space-y-3">
            {tasks.map((task, index) => {
              const priority = PRIORITY_CONFIG[task.priority];
              const isActive = index === currentIndex;
              const isDone = task.status === "COMPLETED";

              return (
                <div
                  key={task.id}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "rounded-xl border p-4 transition-all cursor-pointer",
                    isDone
                      ? "opacity-50 border-green-500/20 bg-green-500/5"
                      : isActive
                      ? "border-primary/40 bg-primary/5 shadow-lg shadow-primary/10"
                      : "glass hover:border-border/80",
                    `priority-${task.priority.toLowerCase()}`
                  )}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isDone) handleComplete(task.id);
                      }}
                      className="mt-0.5 shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium">
                          #{index + 1}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                            priority.bg,
                            priority.color
                          )}
                        >
                          {priority.label}
                        </span>
                      </div>

                      <p
                        className={cn(
                          "font-semibold text-sm",
                          isDone && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </p>

                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2">
                        {task.dueDate && (
                          <span
                            className={cn(
                              "text-[10px]",
                              isOverdue(task.dueDate, task.status)
                                ? "text-red-400"
                                : "text-muted-foreground"
                            )}
                          >
                            📅 {formatDueDate(task.dueDate)}
                          </span>
                        )}
                        {task.estimatedTime && (
                          <span className="text-[10px] text-muted-foreground">
                            ⏱ {task.estimatedTime}min
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive && !isDone && (
                      <Button
                        size="sm"
                        className="shrink-0 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(task.id);
                        }}
                      >
                        Done <CheckCircle className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigate */}
          {currentIndex < tasks.length - 1 &&
            tasks[currentIndex]?.status !== "COMPLETED" && (
              <Button
                variant="outline"
                className="mt-6 gap-2"
                onClick={() => setCurrentIndex((i) => i + 1)}
              >
                Skip to next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
        </div>
      )}
    </div>
  );
}
