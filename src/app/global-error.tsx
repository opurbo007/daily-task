"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-background text-foreground min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <p className="text-6xl">⚠️</p>
          <h2 className="text-2xl font-bold">Something went wrong!</h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            An unexpected error occurred. Our team has been notified.
          </p>
          <Button onClick={() => reset()}>Try again</Button>
        </div>
      </body>
    </html>
  );
}
