import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { formatTaskList, sendMessage, setBotCommands } from "../../../services/telegram";

type TelegramMessage = {
  chat?: { id?: number | string };
  text?: string;
};

export async function GET() {
  return NextResponse.json({ status: "ok", bot: "TaskMaster" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Telegram webhook received:", JSON.stringify(body).slice(0, 200));

    if (body?.message?.chat?.id) {
      await handleCommand(body.message);
      return NextResponse.json({ ok: true });
    }

    if (body?.callback_query) {
      console.log("Callback query:", body.callback_query);
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const chatId = body.chatId;
    if (!chatId) {
      return NextResponse.json({ error: "Telegram chat ID required" }, { status: 400 });
    }

    const sent = await sendMessage(
      chatId,
      `<b>TaskMaster Connected!</b>\n\nCommands:\n/tasks - show all tasks\n/today - show today's tasks\n/priority - show priority tasks\n/fitness - show fitness exercises\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL || ""}">Open TaskMaster</a>`
    );
    await setBotCommands();

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send test message. Check your bot token and chat ID." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { telegramChatId: String(chatId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleCommand(message: TelegramMessage) {
  const chatId = String(message.chat?.id || "");
  const command = (message.text || "").trim().split(/\s+/)[0].toLowerCase();

  console.log("handleCommand called with chatId:", chatId, "command:", command);

  const user = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true },
  });

  console.log("Found user:", user);

  if (!user) {
    const sent = await sendMessage(chatId, "This Telegram chat is not connected. Save this Chat ID in TaskMaster Settings first.");
    console.log("Send not-connected message result:", sent);
    return;
  }

  if (command === "/start" || command === "/help") {
    const sent = await sendMessage(chatId, "<b>TaskMaster commands</b>\n\n/tasks - show all tasks\n/today - show today's tasks\n/priority - show critical/high priority tasks\n/fitness - show fitness exercises");
    console.log("Send help result:", sent);
    return;
  }

  if (command === "/tasks") {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, status: { not: "COMPLETED" } },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      take: 20,
    });
    const sent = await sendMessage(chatId, formatTaskList("All Open Tasks", tasks as any, "No open tasks."));
    console.log("Send tasks result:", sent);
    return;
  }

  if (command === "/today") {
    const now = new Date();
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
        status: { not: "COMPLETED" },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      take: 20,
    });
    const sent = await sendMessage(chatId, formatTaskList("Today's Tasks", tasks as any, "No tasks due today."));
    console.log("Send today result:", sent);
    return;
  }

  if (command === "/priority") {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        priority: { in: ["CRITICAL", "HIGH"] },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 20,
    });
    const sent = await sendMessage(chatId, formatTaskList("Priority Tasks", tasks as any, "No critical or high priority tasks."));
    console.log("Send priority result:", sent);
    return;
  }

  const sent = await sendMessage(chatId, `Unknown command: ${command}\nSend /help for options.`);
  console.log("Send unknown command result:", sent);
}