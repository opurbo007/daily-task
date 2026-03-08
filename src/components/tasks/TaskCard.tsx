"use client";

import { useRef } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Clock,
  Tag,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle,
  Circle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDueDate,
  isOverdue,
  formatMinutes,
} from "@/lib/utils";
import type { Task } from "@/types";

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = PRIORITY_CONFIG[task.priority];
  const overdue = isOverdue(task.dueDate, task.status);
  const isCompleted = task.status === "COMPLETED";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "task-card border group",
        isDragging && "dragging shadow-lg",
        `priority-${task.priority.toLowerCase()}`,
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag handle */}
        <button
          className="mt-0.5 touch-none cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors opacity-0 group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Completion toggle */}
        <button
          onClick={() =>
            onStatusChange(
              task.id,
              isCompleted ? "PENDING" : "COMPLETED"
            )
          }
          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          {isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/tasks/${task.id}`}
              className={cn(
                "text-sm font-medium hover:text-primary transition-colors line-clamp-1",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </Link>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/tasks/${task.id}`} className="flex items-center gap-2">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit task
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    onStatusChange(task.id, isCompleted ? "PENDING" : "COMPLETED")
                  }
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {isCompleted ? "Mark incomplete" : "Mark complete"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-destructive flex items-center gap-2 focus:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Priority badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                priority.bg,
                priority.color
              )}
            >
              {priority.icon} {priority.label}
            </span>

            {/* Status */}
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                STATUS_CONFIG[task.status].bg,
                STATUS_CONFIG[task.status].color
              )}
            >
              {STATUS_CONFIG[task.status].label}
            </span>

            {/* Due date */}
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1 text-[10px]",
                  overdue ? "text-red-400" : "text-muted-foreground"
                )}
              >
                <Clock className="h-3 w-3" />
                {formatDueDate(task.dueDate)}
              </span>
            )}

            {/* Estimated time */}
            {task.estimatedTime && (
              <span className="text-[10px] text-muted-foreground">
                ⏱ {formatMinutes(task.estimatedTime)}
              </span>
            )}

            {/* Tags */}
            {task.tags.map(({ tag }) => (
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
        </div>
      </div>
    </div>
  );
}
