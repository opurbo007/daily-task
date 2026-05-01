import type { Priority, TaskStatus } from "@prisma/client";

export type { Priority, TaskStatus };

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  priority: Priority;
  status: TaskStatus;
  estimatedTime?: number | null;
  actualTime?: number | null;
  sortOrder: number;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags: TaskTag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export interface TaskTag {
  taskId: string;
  tagId: string;
  tag: Tag;
}

export interface TaskFilters {
  priority?: Priority | "ALL";
  status?: TaskStatus | "ALL";
  tagId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  search?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: string;
  priority: Priority;
  status: TaskStatus;
  estimatedTime?: number;
  tagIds?: string[];
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
  sortOrder?: number;
  completedAt?: string | null;
}

export interface DashboardStats {
  todaysTasks: Task[];
  overdueTasks: Task[];
  upcomingTasks: Task[];
  completedToday: Task[];
  totalToday: number;
  completionRate: number;
  streakCount: number;
}

export interface AnalyticsData {
  dailyCompletion: { date: string; completed: number; created: number }[];
  priorityDistribution: { priority: string; count: number; color: string }[];
  weeklyTrend: { week: string; rate: number }[];
  statusBreakdown: { status: string; count: number }[];
}

export interface WeeklyReport {
  id: string;
  weekStart: Date;
  weekEnd: Date;
  totalCreated: number;
  totalCompleted: number;
  completionRate: number;
  mostProductiveDay?: string | null;
  overdueCount: number;
  dailyBreakdown: DailyBreakdown[];
  sentToTelegram: boolean;
  createdAt: Date;
}

export interface DailyBreakdown {
  date: string;
  created: number;
  completed: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "REMINDER" | "OVERDUE" | "REPORT" | "SYSTEM";
  read: boolean;
  createdAt: Date;
}

export interface UserSettings {
  telegramChatId?: string;
  theme: "dark" | "light" | "system";
  notifications: {
    browser: boolean;
    telegram: boolean;
    dailyReminder: boolean;
    overdueAlert: boolean;
  };
}

export type SortField = "dueDate" | "priority" | "createdAt" | "sortOrder";
export type SortOrder = "asc" | "desc";
