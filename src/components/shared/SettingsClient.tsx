"use client";

import { useState } from "react";
import { Send, Bell, Moon, Sun, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string;
    telegramChatId: string | null;
    theme: string;
    notifications: {
      browser: boolean;
      telegram: boolean;
      dailyReminder: boolean;
      overdueAlert: boolean;
    };
  };
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [telegramId, setTelegramId] = useState(user.telegramChatId || "");
  const [testLoading, setTestLoading] = useState(false);
  const [notifications, setNotifications] = useState(user.notifications);
  const [saveLoading, setSaveLoading] = useState(false);

  async function handleTelegramTest() {
    if (!telegramId) {
      toast({ title: "Enter your Telegram Chat ID first", variant: "destructive" });
      return;
    }

    setTestLoading(true);
    try {
      const res = await fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: telegramId }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "✅ Telegram connected!", description: "Check your Telegram for a test message." });
    } catch (err: any) {
      toast({ title: err.message || "Failed to connect Telegram", variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  }

  async function handleSaveNotifications() {
    setSaveLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "✅ Settings saved!" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your TaskMaster experience
        </p>
      </div>

      {/* Profile */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Profile
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input defaultValue={user.name || ""} className="mt-1.5 h-9 text-sm" readOnly />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input defaultValue={user.email} className="mt-1.5 h-9 text-sm" readOnly />
          </div>
        </div>
      </div>

      {/* Telegram Integration */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-400" />
          Telegram Integration
        </h2>

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-400 space-y-1.5">
          <p className="font-medium">📱 How to get your Chat ID:</p>
          <ol className="space-y-1 ml-4 list-decimal">
            <li>Create a bot with <a href="https://t.me/BotFather" target="_blank" className="underline">@BotFather</a> and get your token</li>
            <li>Message <a href="https://t.me/userinfobot" target="_blank" className="underline">@userinfobot</a> to get your Chat ID</li>
            <li>Start your bot by messaging it first</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Your Telegram Chat ID</Label>
            <Input
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="e.g. 123456789"
              className="mt-1.5 h-9 text-sm font-mono"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleTelegramTest}
              disabled={testLoading}
              size="sm"
              className="h-9"
            >
              {testLoading ? "Testing..." : "Test & Save"}
            </Button>
          </div>
        </div>

        {user.telegramChatId && (
          <p className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Telegram connected: {user.telegramChatId}
          </p>
        )}
      </div>

      {/* Notifications */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          Notifications
        </h2>

        <div className="space-y-3">
          {[
            { key: "browser", label: "Browser Notifications", desc: "Get notified in your browser" },
            { key: "telegram", label: "Telegram Notifications", desc: "Send alerts to Telegram" },
            { key: "dailyReminder", label: "Daily Morning Reminder", desc: "Receive daily task summary at 8 AM" },
            { key: "overdueAlert", label: "Overdue Alerts", desc: "Get alerted when tasks are past due" },
          ].map(({ key, label, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <Switch
                checked={notifications[key as keyof typeof notifications]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [key]: checked }))
                }
              />
            </div>
          ))}
        </div>

        <Button
          onClick={handleSaveNotifications}
          disabled={saveLoading}
          size="sm"
          className="w-full"
        >
          {saveLoading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>

      {/* Theme */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Moon className="h-4 w-4 text-violet-400" />
          Appearance
        </h2>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 rounded-lg border py-2.5 text-xs font-medium capitalize transition-all ${
                theme === t
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-border/80"
              }`}
            >
              {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"}{" "}
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
