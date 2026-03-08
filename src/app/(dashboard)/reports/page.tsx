import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { FileText, TrendingUp, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reports = await prisma.weeklyReport.findMany({
    where: { userId: session.user.id },
    orderBy: { weekStart: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold">Weekly Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your productivity history and trends
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="glass rounded-xl border border-border p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No reports yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Weekly reports are generated every Sunday automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const rate = Math.round(report.completionRate);
            const dailyBreakdown = (report.dailyBreakdown as any[]) || [];

            return (
              <div
                key={report.id}
                className="glass rounded-xl border border-border p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-sm">
                      Week of {format(new Date(report.weekStart), "MMMM d")} –{" "}
                      {format(new Date(report.weekEnd), "MMMM d, yyyy")}
                    </h3>
                    {report.sentToTelegram && (
                      <p className="text-[10px] text-green-400 mt-0.5 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Sent to Telegram
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-bold",
                      rate >= 80
                        ? "bg-green-500/10 text-green-400"
                        : rate >= 50
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    )}
                  >
                    {rate}%
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Created", value: report.totalCreated, icon: FileText, color: "text-blue-400" },
                    { label: "Completed", value: report.totalCompleted, icon: CheckCircle, color: "text-green-400" },
                    { label: "Overdue", value: report.overdueCount, icon: AlertTriangle, color: "text-red-400" },
                    { label: "Best Day", value: report.mostProductiveDay || "—", icon: Calendar, color: "text-primary" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="rounded-lg bg-muted/30 p-3">
                      <Icon className={cn("h-3.5 w-3.5 mb-1", color)} />
                      <p className="text-lg font-bold">{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Daily breakdown */}
                {dailyBreakdown.length > 0 && (
                  <div className="flex gap-1.5 items-end h-16">
                    {dailyBreakdown.map((day: any) => {
                      const maxVal = Math.max(...dailyBreakdown.map((d: any) => d.created), 1);
                      const height = Math.max((day.created / maxVal) * 100, 10);
                      const compRate = day.created > 0 ? (day.completed / day.created) * 100 : 0;

                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center gap-1"
                          title={`${format(new Date(day.date), "EEE")}: ${day.completed}/${day.created}`}
                        >
                          <div
                            className="w-full rounded-sm transition-all"
                            style={{
                              height: `${height}%`,
                              background:
                                compRate >= 80
                                  ? "hsl(142 71% 45%)"
                                  : compRate >= 50
                                  ? "hsl(38 92% 50%)"
                                  : "hsl(217 91% 60%)",
                              opacity: 0.7,
                            }}
                          />
                          <span className="text-[8px] text-muted-foreground">
                            {format(new Date(day.date), "E")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
