"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressCardProps {
  completionRate: number;
  completedCount: number;
  totalCount: number;
}

export default function ProgressCard({
  completionRate,
  completedCount,
  totalCount,
}: ProgressCardProps) {
  const getMotivation = (rate: number) => {
    if (rate === 100) return { text: "Perfect day! 🎉", color: "text-green-400" };
    if (rate >= 80) return { text: "Almost there! 💪", color: "text-blue-400" };
    if (rate >= 50) return { text: "Good progress! ⚡", color: "text-amber-400" };
    if (rate > 0) return { text: "Keep going! 🔥", color: "text-orange-400" };
    return { text: "Let's start! 🚀", color: "text-primary" };
  };

  const motivation = getMotivation(completionRate);

  return (
    <div className="glass rounded-xl border border-border p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Daily Progress</h3>
          <p className={cn("text-xs mt-0.5", motivation.color)}>
            {motivation.text}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>
            {completedCount}/{totalCount} tasks
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-bar mb-3">
        <div
          className="progress-fill"
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0%</span>
        <span
          className={cn(
            "font-bold text-sm",
            completionRate === 100 ? "text-green-400" : "text-foreground"
          )}
        >
          {completionRate}%
        </span>
        <span>100%</span>
      </div>

      {/* Milestone markers */}
      <div className="flex gap-2 mt-3">
        {[25, 50, 75, 100].map((milestone) => (
          <div
            key={milestone}
            className={cn(
              "flex-1 h-1.5 rounded-full transition-colors duration-500",
              completionRate >= milestone
                ? "bg-gradient-to-r from-primary to-cyan-500"
                : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
