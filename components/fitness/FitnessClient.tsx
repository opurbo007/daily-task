"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, addMonths, endOfMonth, endOfWeek, isWithinInterval, startOfMonth, startOfWeek } from "date-fns";
import { CheckCircle, Circle, Dumbbell, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import type { Task, Tag } from "../../types";
import { cn, formatDueDate } from "../../lib/utils";

interface FitnessClientProps {
  tasks: Task[];
  fitnessTag: Tag;
}

type RepeatMode = "once" | "daily-week" | "daily-month";

function buildExerciseDescription(sets: string, notes: string, repeat: RepeatMode) {
  return [`Sets: ${sets || "1"}`, `Repeat: ${repeat}`, notes.trim()].filter(Boolean).join("\n");
}

function getSets(description?: string | null) {
  return description?.match(/^Sets:\s*(.+)$/m)?.[1] || "1";
}

function getNotes(description?: string | null) {
  return (description || "")
    .split("\n")
    .filter((line) => !line.startsWith("Sets:") && !line.startsWith("Repeat:"))
    .join("\n")
    .trim();
}

export default function FitnessClient({ tasks: initialTasks, fitnessTag }: FitnessClientProps) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState(initialTasks);
  const [range, setRange] = useState<"week" | "month">("week");
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [sets, setSets] = useState("3");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [repeat, setRepeat] = useState<RepeatMode>("once");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const visibleTasks = useMemo(() => {
    const now = new Date();
    const interval =
      range === "week"
        ? { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
        : { start: startOfMonth(now), end: endOfMonth(now) };

    return tasks.filter((task) => {
      const itemDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
      return isWithinInterval(itemDate, interval);
    });
  }, [tasks, range]);

  const completed = visibleTasks.filter((task) => task.status === "COMPLETED").length;
  const completionRate = visibleTasks.length ? Math.round((completed / visibleTasks.length) * 100) : 0;

  function repeatDates() {
    const start = new Date(`${date}T09:00:00`);
    if (repeat === "once") return [start];

    const end = repeat === "daily-week" ? endOfWeek(start, { weekStartsOn: 1 }) : addMonths(start, 1);
    const dates = [];
    for (let day = start; day <= end; day = addDays(day, 1)) dates.push(day);
    return dates;
  }

  async function addExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const created: Task[] = [];
      for (const dueDate of repeatDates()) {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: buildExerciseDescription(sets, notes, repeat),
            dueDate: dueDate.toISOString(),
            priority: "MEDIUM",
            status: "PENDING",
            estimatedTime: minutes ? Number(minutes) : null,
            tagIds: [fitnessTag.id],
          }),
        });
        if (!res.ok) throw new Error();
        created.push(await res.json());
      }

      setTasks((prev) => [...created, ...prev]);
      setTitle("");
      setNotes("");
      toast({ title: created.length === 1 ? "Exercise added" : `${created.length} daily exercises added` });
    } catch {
      toast({ title: "Failed to add exercise", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task: Task) {
    const nextStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    setTasks((prev) =>
      prev.map((item) =>
        item.id === task.id
          ? { ...item, status: nextStatus as any, completedAt: nextStatus === "COMPLETED" ? new Date() : null }
          : item
      )
    );

    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : null }),
    });
  }

  async function saveExercise(task: Task, form: HTMLFormElement) {
    const data = new FormData(form);
    const payload = {
      title: String(data.get("title") || task.title),
      estimatedTime: Number(data.get("minutes") || task.estimatedTime || 0) || null,
      dueDate: `${String(data.get("date"))}T09:00:00`,
      description: buildExerciseDescription(String(data.get("sets") || "1"), String(data.get("notes") || ""), "once"),
    };

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      toast({ title: "Failed to update exercise", variant: "destructive" });
      return;
    }

    const updated = await res.json();
    setTasks((prev) => prev.map((item) => (item.id === task.id ? updated : item)));
    setEditingId(null);
    toast({ title: "Exercise updated" });
  }

  async function deleteExercise(taskId: string) {
    if (!window.confirm("Delete this exercise? This cannot be undone.")) return;

    const oldTasks = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast({ title: "Exercise deleted" });
    } catch {
      setTasks(oldTasks);
      toast({ title: "Failed to delete exercise", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Dumbbell className="h-5 w-5 text-emerald-400" />
            Fitness Tracker
          </h1>
          <p className="text-xs text-muted-foreground">
            Viewing this {range}; {completed}/{visibleTasks.length} completed.
          </p>
        </div>
        <Select value={range} onValueChange={(value) => setRange(value as "week" | "month")}>
          <SelectTrigger className="h-9 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">View week</SelectItem>
            <SelectItem value="month">View month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="glass rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="font-medium">Fitness progress</span>
          <span className="text-muted-foreground">{completionRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
        </div>
      </div>

      <form onSubmit={addExercise} className="glass rounded-xl border border-border p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_90px_90px_150px_160px]">
          <Field label="Exercise">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Pushups, walk, yoga..." />
          </Field>
          <Field label="Sets">
            <Input type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} />
          </Field>
          <Field label="Minutes">
            <Input type="number" min="1" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </Field>
          <Field label="Start date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Schedule">
            <Select value={repeat} onValueChange={(value) => setRepeat(value as RepeatMode)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Create once</SelectItem>
                <SelectItem value="daily-week">Create daily until Sunday</SelectItem>
                <SelectItem value="daily-month">Create daily for 30 days</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes, reps, intensity, each-day variation..." rows={2} />
        <Button type="submit" disabled={saving} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </form>

      <div className="grid gap-2">
        {visibleTasks.length === 0 ? (
          <div className="glass rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
            No fitness exercises yet for this {range}.
          </div>
        ) : (
          visibleTasks.map((task) => (
            <div key={task.id} className="task-card border">
              {editingId === task.id ? (
                <form
                  className="grid gap-3 sm:grid-cols-[1fr_80px_90px_140px_auto_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveExercise(task, event.currentTarget);
                  }}
                >
                  <Input name="title" defaultValue={task.title} />
                  <Input name="sets" type="number" min="1" defaultValue={getSets(task.description)} />
                  <Input name="minutes" type="number" min="1" defaultValue={task.estimatedTime || ""} />
                  <Input name="date" type="date" defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : date} />
                  <Textarea name="notes" defaultValue={getNotes(task.description)} className="sm:col-span-4" rows={2} />
                  <Button type="submit" size="icon" className="h-9 w-9">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleComplete(task)} className="text-muted-foreground hover:text-primary">
                    {task.status === "COMPLETED" ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Link href={`/tasks/${task.id}`} className={cn("text-sm font-medium hover:text-primary", task.status === "COMPLETED" && "line-through text-muted-foreground")}>
                      {task.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {formatDueDate(task.dueDate)} | {getSets(task.description)} sets | {task.estimatedTime || 0} min
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(task.id)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteExercise(task.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
