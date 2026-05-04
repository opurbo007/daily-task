"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Loader2, Lock } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";

export default function ResetPasswordPage({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      toast({ title: "Invalid or expired reset link", variant: "destructive" });
      return;
    }

    toast({ title: "Password updated" });
    router.push("/login");
  }


  return (   
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/30">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Choose new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter a password with at least 6 characters.</p>
        </div>

        <div className="glass rounded-2xl border border-border p-6">
          {!email || !token ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">This reset link is missing required information.</p>
              <Button asChild className="w-full">
                <Link href="/forgot-password">Request New Link</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    className="h-9 pl-9 text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="h-9 w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
