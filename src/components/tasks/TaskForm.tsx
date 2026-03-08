"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { CalendarIcon, Tag, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

interface TaskFormProps {
  tags: { id: string; name: string; color: string }[];
  mode: "create" | "edit";
  task?: Task;
}

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low", color: "text-green-500" },
  { value: "MEDIUM", label: "Medium", color: "text-amber-500" },
  { value: "HIGH", label: "High", color: "text-red-500" },
  { value: "CRITICAL", label: "Critical", color: "text-red-600" },
];

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function TaskForm({ tags, mode, task }: TaskFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(
    task?.tags.map((t) => t.tagId) || []
  );
  const [newTagName, setNewTagName] = useState("");

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    dueDate: task?.dueDate
      ? format(new Date(task.dueDate), "yyyy-MM-dd'T'HH:mm")
      : "",
    priority: task?.priority || "MEDIUM",
    status: task?.status || "PENDING",
    estimatedTime: task?.estimatedTime?.toString() || "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        dueDate: formData.dueDate || null,
        estimatedTime: formData.estimatedTime
          ? parseInt(formData.estimatedTime)
          : null,
        tagIds: selectedTags,
      };

      const url = mode === "create" ? "/api/tasks" : `/api/tasks/${task?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());

      toast({
        title: mode === "create" ? "✅ Task created!" : "✅ Task updated!",
        description: formData.title,
      });
      router.push("/tasks");
      router.refresh();
    } catch (err) {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs">
            Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="What needs to be done?"
            className="text-sm"
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-xs">
            Description
          </Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add more details..."
            className="text-sm resize-none"
            rows={3}
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, priority: v }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className={cn("font-medium", opt.color)}>
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, status: v }))
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date & Estimated time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="dueDate" className="text-xs">
              Due Date
            </Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="estimatedTime" className="text-xs">
              Estimated Time (minutes)
            </Label>
            <Input
              id="estimatedTime"
              name="estimatedTime"
              type="number"
              min="1"
              value={formData.estimatedTime}
              onChange={handleChange}
              placeholder="e.g. 30"
              className="text-xs h-9"
            />
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label className="text-xs">Tags</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const selected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() =>
                    setSelectedTags((prev) =>
                      selected
                        ? prev.filter((id) => id !== tag.id)
                        : [...prev, tag.id]
                    )
                  }
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium transition-all border",
                    selected ? "opacity-100" : "opacity-50 hover:opacity-75"
                  )}
                  style={{
                    borderColor: tag.color,
                    backgroundColor: selected ? tag.color + "20" : "transparent",
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 border border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : mode === "create" ? (
            "Create Task"
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
