"use client";

import { useState, useEffect } from "react";

interface StreakData {
  streakCount: number;
  lastActiveDate: string | null;
  loading: boolean;
}

export function useStreak(): StreakData {
  const [data, setData] = useState<StreakData>({
    streakCount: 0,
    lastActiveDate: null,
    loading: true,
  });

  useEffect(() => {
    async function fetch() {
      try {
        const res = await window.fetch("/api/user/streak");
        if (!res.ok) return;
        const json = await res.json();
        setData({ ...json, loading: false });
      } catch {
        setData((d) => ({ ...d, loading: false }));
      }
    }
    fetch();
  }, []);

  return data;
}
