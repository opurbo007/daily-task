"use client";

import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsOverviewProps {
  todayCount: number;
  overdueCount: number;
  upcomingCount: number;
  completedTodayCount: number;
}

const stats = (props: StatsOverviewProps) => [
  {
    label: "Today's Tasks",
    value: props.todayCount,
    icon: Clock,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    border: "border-blue-400/20",
  },
  {
    label: "Overdue",
    value: props.overdueCount,
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/20",
    urgent: props.overdueCount > 0,
  },
  {
    label: "Upcoming",
    value: props.upcomingCount,
    icon: Calendar,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
    border: "border-amber-400/20",
  },
  {
    label: "Completed Today",
    value: props.completedTodayCount,
    icon: CheckCircle,
    color: "text-green-400",
    bg: "bg-green-400/10",
    border: "border-green-400/20",
  },
];

export default function StatsOverview(props: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats(props).map((stat, i) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className={cn(
              "stat-card border",
              stat.border,
              "animation-delay-" + i * 100
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </span>
              <div className={cn("rounded-lg p-1.5", stat.bg)}>
                <Icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span
                className={cn(
                  "text-3xl font-bold tabular-nums",
                  stat.urgent ? "text-red-400" : "text-foreground"
                )}
              >
                {stat.value}
              </span>
              {stat.urgent && stat.value > 0 && (
                <span className="mb-1 text-xs text-red-400 animate-pulse">
                  needs attention
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
