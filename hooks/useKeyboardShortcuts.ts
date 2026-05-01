"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd shortcuts
      if (isCtrl) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault();
            router.push("/tasks/create");
            break;
          case "k":
            e.preventDefault();
            router.push("/tasks");
            break;
          case "f":
            e.preventDefault();
            router.push("/focus");
            break;
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            break;
        }
        return;
      }

      // Single key shortcuts (no modifier)
      switch (e.key.toLowerCase()) {
        case "n":
          // Quick add - handled by QuickAdd component
          break;
        case "g":
          // Navigation mode - press G then D for dashboard, etc.
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
}
