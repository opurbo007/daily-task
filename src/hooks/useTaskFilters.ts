"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Priority, TaskStatus, TaskFilters } from "@/types";

export function useTaskFilters(): {
  filters: TaskFilters;
  setFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
} {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters: TaskFilters = useMemo(() => ({
    priority: (searchParams.get("priority") as Priority) || undefined,
    status: (searchParams.get("status") as TaskStatus) || undefined,
    tagId: searchParams.get("tagId") || undefined,
    search: searchParams.get("q") || undefined,
  }), [searchParams]);

  const setFilter = useCallback(
    <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => {
      const params = new URLSearchParams(searchParams.toString());
      const paramKey = key === "search" ? "q" : key;
      if (value) {
        params.set(paramKey, String(value));
      } else {
        params.delete(paramKey);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasActiveFilters = !!(
    filters.priority || filters.status || filters.tagId || filters.search
  );

  return { filters, setFilter, clearFilters, hasActiveFilters };
}
