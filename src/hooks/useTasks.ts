"use client";

import { useState, useCallback } from "react";
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types";

export function useTasks(initialTasks: Task[] = []) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to create task");
      const task = await res.json();
      setTasks((prev) => [task, ...prev]);
      return task;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (id: string, input: Partial<UpdateTaskInput>): Promise<Task | null> => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Failed to update task");
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const completeTask = useCallback(
    (id: string) =>
      updateTask(id, {
        status: "COMPLETED",
        completedAt: new Date().toISOString(),
      }),
    [updateTask]
  );

  return {
    tasks,
    setTasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
  };
}
