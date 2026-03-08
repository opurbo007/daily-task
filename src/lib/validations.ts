import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(5000).optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("PENDING"),
  estimatedTime: z.number().int().positive().max(1440).optional().nullable(),
  tagIds: z.array(z.string().cuid()).optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  sortOrder: z.number().int().min(0).optional(),
  completedAt: z.string().datetime({ offset: true }).optional().nullable(),
  actualTime: z.number().int().positive().max(1440).optional().nullable(),
});

export const createTagSchema = z.object({
  name: z.string().min(1).max(30),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .default("#6366f1"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSettingsSchema = z.object({
  telegramChatId: z.string().optional().nullable(),
  theme: z.enum(["dark", "light", "system"]).optional(),
  notifications: z
    .object({
      browser: z.boolean(),
      telegram: z.boolean(),
      dailyReminder: z.boolean(),
      overdueAlert: z.boolean(),
    })
    .optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
