import { NextRequest, NextResponse } from "next/server";
import {
  runDailyReminderJob,
  runOverdueCheckJob,
  runWeeklyReportJob,
} from "@/services/cron";

// Secured cron endpoint — call with CRON_SECRET header
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { job } = await req.json();

  try {
    switch (job) {
      case "daily-reminder":
        await runDailyReminderJob();
        break;
      case "overdue-check":
        await runOverdueCheckJob();
        break;
      case "weekly-report":
        await runWeeklyReportJob();
        break;
      default:
        return NextResponse.json({ error: "Unknown job" }, { status: 400 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}
