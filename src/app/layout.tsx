import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import Providers from "@/components/shared/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TaskMaster — Daily Productivity Hub",
    template: "%s | TaskMaster",
  },
  description:
    "A modern task management system with priority management, Telegram alerts, and productivity analytics.",
  keywords: ["task manager", "productivity", "todo", "daily planner"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
