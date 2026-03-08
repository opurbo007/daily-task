"use client";

import { useState, useRef } from "react";
import { Plus, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function QuickAdd() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  function handleOpen() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          priority: "MEDIUM",
          status: "PENDING",
        }),
      });

      if (!res.ok) throw new Error();

      toast({ title: "⚡ Task added!", description: title });
      setTitle("");
      setOpen(false);
      router.refresh();
    } catch {
      toast({ title: "Failed to add task", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setOpen(false);
      setTitle("");
    }
  }

  return (
    <div
      className={cn(
        "glass rounded-xl border border-border transition-all duration-300",
        open ? "border-primary/30" : "hover:border-primary/20"
      )}
    >
      {open ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3 quick-add-appear">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Quick add task... (Enter to save, Esc to cancel)"
            className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
          />
          <div className="flex gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setOpen(false); setTitle(""); }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs"
              disabled={!title.trim() || loading}
            >
              Add
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={handleOpen}
          className="flex w-full items-center gap-3 p-3 text-left group"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded border border-dashed border-primary/30 group-hover:border-primary transition-colors">
            <Plus className="h-3 w-3 text-primary/50 group-hover:text-primary transition-colors" />
          </div>
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            Quick add task...
          </span>
          <kbd className="ml-auto text-[10px] border border-border rounded px-1.5 py-0.5 text-muted-foreground">
            N
          </kbd>
        </button>
      )}
    </div>
  );
}
