import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from "date-fns";
import type { Priority, TaskStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  LOW: {
    label: "Low",
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: "↓",
  },
  MEDIUM: {
    label: "Medium",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "→",
  },
  HIGH: {
    label: "High",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "↑",
  },
  CRITICAL: {
    label: "Critical",
    color: "text-red-600",
    bg: "bg-red-600/10",
    border: "border-red-600/40",
    icon: "⚠",
  },
};

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  PENDING: {
    label: "Pending",
    color: "text-slate-400",
    bg: "bg-slate-400/10",
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "text-slate-500",
    bg: "bg-slate-500/10",
  },
};

export function formatDueDate(date: Date | null | undefined): string {
  if (!date) return "No due date";
  const d = new Date(date);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isPast(d)) return `${formatDistanceToNow(d)} ago`;
  return format(d, "MMM d, yyyy");
}

export function isOverdue(date: Date | null | undefined, status: TaskStatus): boolean {
  if (!date || status === "COMPLETED" || status === "CANCELLED") return false;
  return isPast(new Date(date));
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getPriorityWeight(priority: Priority): number {
  const weights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return weights[priority];
}

export function generateGradient(index: number): string {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-blue-500 to-cyan-600",
    "from-emerald-500 to-teal-600",
    "from-orange-500 to-red-600",
    "from-pink-500 to-rose-600",
  ];
  return gradients[index % gradients.length];
}

export const KEYBOARD_SHORTCUTS = {
  newTask: { key: "n", modifier: "ctrl", label: "New Task" },
  search: { key: "k", modifier: "ctrl", label: "Search" },
  focusMode: { key: "f", modifier: "ctrl", label: "Focus Mode" },
  dashboard: { key: "d", modifier: "ctrl", label: "Dashboard" },
};
