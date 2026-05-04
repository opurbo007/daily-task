"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, Flag, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import type { Task, Tag } from "../../types";
import { cn, formatDueDate } from "../../lib/utils";

interface LifeGoalsClientProps {
  goals: Task[];
  goalTag: Tag;
}

export default function LifeGoalsClient({ goals: initialGoals, goalTag }: LifeGoalsClientProps) {
  const { toast } = useToast();
  const [goals, setGoals] = useState(initialGoals);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          dueDate: targetDate || null,
          priority: "HIGH",
          status: "PENDING",
          tagIds: [goalTag.id],
        }),
      });

      if (!res.ok) throw new Error();
      const goal = await res.json();
      setGoals((prev) => [goal, ...prev]);
      setTitle("");
      setDescription("");
      setTargetDate("");
      toast({ title: "Life goal added" });
    } catch {
      toast({ title: "Failed to add goal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(goal: Task) {
    const nextStatus = goal.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setGoals((prev) =>
      prev.map((item) =>
        item.id === goal.id
          ? { ...item, status: nextStatus as any, completedAt: nextStatus === "COMPLETED" ? new Date() : null }
          : item
      )
    );
    await fetch(`/api/tasks/${goal.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null }),
    });
  }

  async function deleteGoal(goalId: string) {
    if (!window.confirm("Delete this life goal? This cannot be undone.")) return;

    const oldGoals = goals;
    setGoals((prev) => prev.filter((goal) => goal.id !== goalId));
    try {
      const res = await fetch(`/api/tasks/${goalId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Goal deleted" });
    } catch {
      setGoals(oldGoals);
      toast({ title: "Failed to delete goal", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Flag className="h-5 w-5 text-sky-400" />
          Life Goals
        </h1>
        <p className="text-xs text-muted-foreground">Lifetime achievements, big dreams, and long-horizon commitments.</p>
      </div>

      <form onSubmit={addGoal} className="glass rounded-xl border border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <div className="space-y-1.5">
            <Label htmlFor="goal" className="text-xs">Goal</Label>
            <Input id="goal" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Write a book, buy a home, run a marathon..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetDate" className="text-xs">Target date</Label>
            <Input id="targetDate" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this matters, milestones, notes..." rows={3} />
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </form>

      <div className="grid gap-2">
        {goals.length === 0 ? (
          <div className="glass rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No life goals yet.
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="task-card border">
              <div className="flex items-start gap-3">
                <button onClick={() => toggleComplete(goal)} className="mt-0.5 text-muted-foreground hover:text-primary">
                  {goal.status === "COMPLETED" ? <CheckCircle className="h-4 w-4 text-sky-500" /> : <Circle className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <Link href={`/tasks/${goal.id}`} className={cn("text-sm font-medium hover:text-primary", goal.status === "COMPLETED" && "line-through text-muted-foreground")}>
                    {goal.title}
                  </Link>
                  {goal.description ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{goal.description}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">Target: {formatDueDate(goal.dueDate)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteGoal(goal.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
