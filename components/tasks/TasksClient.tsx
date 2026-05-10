"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  Search,
  Grid,
  List,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import TaskCard from "./TaskCard";
import type { Task, Tag, TaskFilters } from "../../types";
import { cn } from "../../lib/utils";
import { useToast } from "../../hooks/use-toast";

interface TasksClientProps {
  tasks: Task[];
  tags: Tag[];
  initialFilters?: Record<string, string | undefined>;
}

export default function TasksClient({
  tasks: initialTasks,
  tags,
  initialFilters,
}: TasksClientProps) {
  const router = useRouter();
  const { toast, dismiss } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "completed">("pending");
  const [tagId, setTagId] = useState<string | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (tab === "pending" && task.status === "COMPLETED") return false;
      if (tab === "completed" && task.status !== "COMPLETED") return false;
      if (tagId && !task.tags.some((t) => t.tagId === tagId))
        return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (a.status === "COMPLETED" && b.status !== "COMPLETED") return 1;
      if (a.status !== "COMPLETED" && b.status === "COMPLETED") return -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [tasks, search, tab, tagId]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    const newTasks = arrayMove(tasks, oldIndex, newIndex);

    setTasks(newTasks);

    // Update sort orders in DB
    try {
      await fetch("/api/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: newTasks.map((task, index) => ({ id: task.id, sortOrder: index })),
        }),
      });
    } catch {
      toast({ title: "Failed to save order", variant: "destructive" });
    }
  }

  async function handleStatusChange(taskId: string, newStatus: string) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus as any,
              completedAt: newStatus === "COMPLETED" ? new Date() : null,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error();
      if (newStatus === "COMPLETED") {
        toast({ title: "✅ Task completed!", description: "Great work!" });
      }
    } catch {
      toast({ title: "Failed to update task", variant: "destructive" });
      router.refresh();
    }
  }

  async function handleDelete(taskId: string) {
    const { id: toastId, dismiss } = toast({
      title: "Delete task?",
      description: "This cannot be undone.",
      variant: "destructive",
      action: (
        <button
          className="bg-destructive text-destructive-foreground px-2 py-1 text-xs font-medium rounded hover:bg-destructive/90 transition-colors"
          onClick={() => {
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
            fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
              .then(() => toast({ title: "Task deleted" }))
              .catch(() => {
                toast({ title: "Failed to delete task", variant: "destructive" });
                router.refresh();
              });
            dismiss();
          }}
        >
          Delete
        </button>
      ),
    });
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Tasks</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        <button
          onClick={() => setTab("pending")}
          className={cn(
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            tab === "pending"
              ? "bg-background shadow-sm"
              : "hover:bg-muted"
          )}
        >
          Pending
        </button>
        <button
          onClick={() => setTab("completed")}
          className={cn(
            "px-4 py-1.5 text-xs font-medium rounded-md transition-colors",
            tab === "completed"
              ? "bg-background shadow-sm"
              : "hover:bg-muted"
          )}
        >
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl border border-border p-3">
        <div className="flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Tag filter */}
          {tags.length > 0 && (
            <Select
              value={tagId || "ALL"}
              onValueChange={(v) =>
                setTagId(v === "ALL" ? undefined : v)
              }
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    <span className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task list with DnD */}
      {filteredTasks.length === 0 ? (
        <div className="glass rounded-xl border border-border p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-medium">No tasks found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search || tagId
              ? "Try adjusting your filters"
              : "No tasks yet"}
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredTasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2"
              )}
            >
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
