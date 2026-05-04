import { NextRequest, NextResponse } from "next/server";
import {
  runDailyReminderJob,
  runDueSoonReminderJob,
  runOverdueCheckJob,
  runWeeklyReportJob,
} from "../../../services/cron";

export async function GET(req: NextRequest) {
  return runCronJob(req);
}

export async function POST(req: NextRequest) {
  return runCronJob(req);
}

async function runCronJob(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (secret !== process.env.CRON_SECRET && bearer !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchJob = req.nextUrl.searchParams.get("job");
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const job = searchJob || body.job;

  try {
    switch (job) {
      case "daily-reminder":
        await runDailyReminderJob();
        break;
      case "overdue-check":
        await runOverdueCheckJob();
        break;
      case "due-soon":
        await runDueSoonReminderJob();
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
