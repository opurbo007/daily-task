"use client";

import { useState } from "react";
import Link from "next/link";
import { Flame, Loader2, Mail } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    setSent(true);

    if (!res.ok) {
      toast({ title: "Could not send reset email", variant: "destructive" });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-cyan-500 shadow-lg shadow-primary/30">
            <Flame className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset password</h1>
          <p className="mt-1 text-sm text-muted-foreground">We will send a reset link if the email exists.</p>
        </div>

        <div className="glass rounded-2xl border border-border p-6">
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
              <Button asChild className="w-full">
                <Link href="/login">Back to Sign In</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="h-9 pl-9 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="h-9 w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
