"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun, Search, Plus, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/useNotifications";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  useKeyboardShortcuts();

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-card/30 px-6 backdrop-blur-sm">
      {/* Quick search */}
      <div className="flex-1 max-w-sm">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border px-3 py-1.5",
            "bg-background/50 text-muted-foreground cursor-pointer",
            "hover:border-primary/30 hover:text-foreground transition-colors",
            "text-sm"
          )}
          onClick={() => router.push("/tasks")}
        >
          <Search className="h-3.5 w-3.5" />
          <span className="flex-1 text-xs">Search tasks...</span>
          <div className="flex items-center gap-0.5 text-[10px] border border-border rounded px-1 py-0.5">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Quick add */}
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => router.push("/tasks/create")}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New Task</span>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button
                  className="text-xs text-primary hover:underline"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {notifications.slice(0, 5).map((notif) => (
                  <DropdownMenuItem
                    key={notif.id}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 cursor-pointer",
                      !notif.read && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-xs font-medium">{notif.title}</span>
                      {!notif.read && (
                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {notif.message}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {format(new Date(notif.createdAt), "MMM d, h:mm a")}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>
      </div>
    </header>
  );
}
