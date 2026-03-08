"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StreakCardProps {
  streakCount: number;
  lastActiveDate?: Date | null;
}

export default function StreakCard({ streakCount, lastActiveDate }: StreakCardProps) {
  const isActive = streakCount > 0;
  const isHot = streakCount >= 7;

  return (
    <div
      className={cn(
        "glass rounded-xl border p-5 animate-fade-in flex flex-col items-center justify-center text-center",
        isHot ? "border-orange-500/30 bg-orange-500/5" : "border-border"
      )}
    >
      <div
        className={cn(
          "mb-2 rounded-full p-3",
          isHot
            ? "bg-orange-500/20 streak-active"
            : isActive
            ? "bg-amber-500/10"
            : "bg-muted"
        )}
      >
        <Flame
          className={cn(
            "h-6 w-6",
            isHot
              ? "text-orange-500"
              : isActive
              ? "text-amber-400"
              : "text-muted-foreground"
          )}
        />
      </div>

      <div className="tabular-nums">
        <span
          className={cn(
            "text-4xl font-bold",
            isHot
              ? "text-orange-500"
              : isActive
              ? "text-amber-400"
              : "text-muted-foreground"
          )}
        >
          {streakCount}
        </span>
        <span className="text-sm text-muted-foreground ml-1">
          day{streakCount !== 1 ? "s" : ""}
        </span>
      </div>

      <p className="text-xs font-medium mt-1">
        {isHot ? "🔥 You're on fire!" : isActive ? "⚡ Keep it up!" : "Start your streak!"}
      </p>

      {lastActiveDate && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Last active: {format(new Date(lastActiveDate), "MMM d")}
        </p>
      )}
    </div>
  );
}
