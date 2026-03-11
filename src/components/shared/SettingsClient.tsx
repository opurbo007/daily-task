"use client";

import { useState } from "react";
import { Send, Bell, Moon, User, CheckCircle, Lock, Save, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useSession } from "next-auth/react";

interface SettingsClientProps {
  user: {
    name: string | null;
    email: string;
    telegramChatId: string | null;
    theme: string;
    notificationSettings: {
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
  const { update: updateSession } = useSession();

  // ── Profile state ─────────────────────────────────
  const [profile, setProfile] = useState({ name: user.name || "", email: user.email });
  const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
  const [profileLoading, setProfileLoading] = useState(false);

  // ── Password state ────────────────────────────────
  const [passwords, setPasswords] = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string[]>>({});
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // ── Telegram / notifications state ────────────────
  const [telegramId, setTelegramId] = useState(user.telegramChatId || "");
  const [testLoading, setTestLoading] = useState(false);
  const [notifications, setNotifications] = useState(user.notificationSettings);
  const [notifLoading, setNotifLoading] = useState(false);

  // ── Handlers ──────────────────────────────────────

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileErrors({});
    setProfileLoading(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (!res.ok) {
        setProfileErrors(data.error ?? {});
        toast({ title: "Failed to update profile", variant: "destructive" });
        return;
      }

      // Refresh the NextAuth session so the header shows updated name/email
      await updateSession({ name: data.name, email: data.email });
      toast({ title: "✅ Profile updated!" });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErrors({});

    if (passwords.newPw !== passwords.confirm) {
      setPwErrors({ confirm: ["Passwords do not match"] });
      return;
    }
    if (passwords.newPw.length < 6) {
      setPwErrors({ newPw: ["Password must be at least 6 characters"] });
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPw }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPwErrors(data.error ?? {});
        toast({ title: "Failed to change password", variant: "destructive" });
        return;
      }

      toast({ title: "✅ Password changed!" });
      setPasswords({ current: "", newPw: "", confirm: "" });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setPwLoading(false);
    }
  }

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
    setNotifLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationSettings: notifications }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "✅ Notification settings saved!" });
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setNotifLoading(false);
    }
  }

  // ── UI ────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your profile, security and preferences
        </p>
      </div>

      {/* ── Profile ─────────────────────────────── */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Profile
        </h2>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              placeholder="Your name"
              className="mt-1.5 h-9 text-sm"
              required
            />
            {profileErrors.name && (
              <p className="text-xs text-red-400 mt-1">{profileErrors.name[0]}</p>
            )}
          </div>

          <div>
            <Label className="text-xs">Email Address</Label>
            <Input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@example.com"
              className="mt-1.5 h-9 text-sm"
              required
            />
            {profileErrors.email && (
              <p className="text-xs text-red-400 mt-1">{profileErrors.email[0]}</p>
            )}
          </div>

          <Button type="submit" size="sm" className="w-full" disabled={profileLoading}>
            {profileLoading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving…</>
              : <><Save className="h-3.5 w-3.5 mr-2" />Save Profile</>
            }
          </Button>
        </form>
      </div>

      {/* ── Change Password ──────────────────────── */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" /> Change Password
        </h2>

        <form onSubmit={handleChangePassword} className="space-y-3">
          {/* Current password */}
          <div>
            <Label className="text-xs">Current Password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showCurrent ? "text" : "password"}
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
                className="h-9 text-sm pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrent ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {pwErrors.currentPassword && (
              <p className="text-xs text-red-400 mt-1">{pwErrors.currentPassword[0]}</p>
            )}
          </div>

          <Separator />

          {/* New password */}
          <div>
            <Label className="text-xs">New Password</Label>
            <div className="relative mt-1.5">
              <Input
                type={showNew ? "text" : "password"}
                value={passwords.newPw}
                onChange={(e) => setPasswords((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="At least 6 characters"
                className="h-9 text-sm pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {pwErrors.newPw && (
              <p className="text-xs text-red-400 mt-1">{pwErrors.newPw[0]}</p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <Label className="text-xs">Confirm New Password</Label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Repeat new password"
              className="mt-1.5 h-9 text-sm"
              required
            />
            {pwErrors.confirm && (
              <p className="text-xs text-red-400 mt-1">{pwErrors.confirm[0]}</p>
            )}
          </div>

          {/* Strength hint */}
          {passwords.newPw && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[
                  passwords.newPw.length >= 6,
                  passwords.newPw.length >= 10,
                  /[A-Z]/.test(passwords.newPw),
                  /[0-9]/.test(passwords.newPw),
                  /[^A-Za-z0-9]/.test(passwords.newPw),
                ].map((met, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      met ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {passwords.newPw.length < 6
                  ? "Too short"
                  : passwords.newPw.length < 10
                  ? "Weak — add more characters"
                  : /[A-Z]/.test(passwords.newPw) && /[0-9]/.test(passwords.newPw)
                  ? "Strong password 💪"
                  : "Medium — add uppercase and numbers"}
              </p>
            </div>
          )}

          <Button type="submit" size="sm" className="w-full" disabled={pwLoading}>
            {pwLoading
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Updating…</>
              : <><Lock className="h-3.5 w-3.5 mr-2" />Update Password</>
            }
          </Button>
        </form>
      </div>

      {/* ── Telegram Integration ─────────────────── */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-blue-400" /> Telegram Integration
        </h2>

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-400 space-y-1.5">
          <p className="font-medium">📱 How to get your Chat ID:</p>
          <ol className="space-y-1 ml-4 list-decimal">
            <li>Create a bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="underline">@BotFather</a> and save your token in <code>.env</code></li>
            <li>Message <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="underline">@userinfobot</a> to get your numeric Chat ID</li>
            <li>Start your bot by messaging it first, then paste your ID below</li>
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
            <Button onClick={handleTelegramTest} disabled={testLoading} size="sm" className="h-9">
              {testLoading ? "Testing…" : "Test & Save"}
            </Button>
          </div>
        </div>

        {user.telegramChatId && (
          <p className="flex items-center gap-1.5 text-xs text-green-400">
            <CheckCircle className="h-3.5 w-3.5" />
            Connected: {user.telegramChatId}
          </p>
        )}
      </div>

      {/* ── Notifications ────────────────────────── */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" /> Notifications
        </h2>

        <div className="space-y-3">
          {[
            { key: "browser",       label: "Browser Notifications",  desc: "Get notified in your browser" },
            { key: "telegram",      label: "Telegram Notifications",  desc: "Send alerts to Telegram" },
            { key: "dailyReminder", label: "Daily Morning Reminder",  desc: "Receive daily task summary at 8 AM" },
            { key: "overdueAlert",  label: "Overdue Alerts",          desc: "Get alerted when tasks are past due" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
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

        <Button onClick={handleSaveNotifications} disabled={notifLoading} size="sm" className="w-full">
          {notifLoading ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />Saving…</> : "Save Notification Settings"}
        </Button>
      </div>

      {/* ── Appearance ───────────────────────────── */}
      <div className="glass rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Moon className="h-4 w-4 text-violet-400" /> Appearance
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
              {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}