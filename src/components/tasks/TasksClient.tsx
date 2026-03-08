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
  Plus,
  Filter,
  Search,
  Grid,
  List,
  SortAsc,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TaskCard from "@/components/tasks/TaskCard";
import type { Task, Tag, TaskFilters } from "@/types";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({
    priority: (initialFilters?.priority as any) || "ALL",
    status: (initialFilters?.status as any) || "ALL",
    tagId: initialFilters?.tagId,
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (search && !task.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority)
        return false;
      if (filters.status && filters.status !== "ALL" && task.status !== filters.status)
        return false;
      if (filters.tagId && !task.tags.some((t) => t.tagId === filters.tagId))
        return false;
      return true;
    });
  }, [tasks, search, filters]);

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
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      toast({ title: "Task deleted" });
    } catch {
      toast({ title: "Failed to delete task", variant: "destructive" });
      router.refresh();
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        <Button size="sm" className="gap-1.5" asChild>
          <Link href="/tasks/create">
            <Plus className="h-4 w-4" />
            New Task
          </Link>
        </Button>
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

          {/* Priority filter */}
          <Select
            value={filters.priority || "ALL"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, priority: v as any }))
            }
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={filters.status || "ALL"}
            onValueChange={(v) =>
              setFilters((f) => ({ ...f, status: v as any }))
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag filter */}
          {tags.length > 0 && (
            <Select
              value={filters.tagId || "ALL"}
              onValueChange={(v) =>
                setFilters((f) => ({ ...f, tagId: v === "ALL" ? undefined : v }))
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
            {search || filters.priority !== "ALL" || filters.status !== "ALL"
              ? "Try adjusting your filters"
              : "Create your first task to get started"}
          </p>
          <Button size="sm" className="mt-4" asChild>
            <Link href="/tasks/create">
              <Plus className="h-4 w-4 mr-1.5" /> Create Task
            </Link>
          </Button>
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
