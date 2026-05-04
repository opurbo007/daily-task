"use client";

import { useState, useEffect } from "react";
import type { Notification } from "../types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", { method: "PATCH" });
  }

  useEffect(() => {
    setLoading(false);
  }, []);

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications };
}
