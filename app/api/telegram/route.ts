import { NextRequest, NextResponse } from "next/server";
import { endOfDay, startOfDay } from "date-fns";
import { auth } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { escapeHtml, formatTaskList, sendMessage, setBotCommands } from "../../../services/telegram";

type TelegramMessage = {
  chat?: { id?: number | string };
  text?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body?.message?.chat?.id) {
    await handleCommand(body.message);
    return NextResponse.json({ ok: true });
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
}

async function handleCommand(message: TelegramMessage) {
  const chatId = String(message.chat?.id || "");
  const command = (message.text || "").trim().split(/\s+/)[0].toLowerCase();

  const user = await prisma.user.findFirst({
    where: { telegramChatId: chatId },
    select: { id: true },
  });

  if (!user) {
    await sendMessage(chatId, "This Telegram chat is not connected. Save this Chat ID in TaskMaster Settings first.");
    return;
  }

  const now = new Date();
  const taskInclude = { tags: { include: { tag: true } } };

  if (command === "/start" || command === "/help") {
    await sendMessage(
      chatId,
      "<b>TaskMaster commands</b>\n\n/tasks - show all tasks\n/today - show today's tasks\n/priority - show critical/high priority tasks\n/fitness - show fitness exercises"
    );
    return;
  }

  if (command === "/today") {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        dueDate: { gte: startOfDay(now), lte: endOfDay(now) },
        status: { not: "COMPLETED" },
      },
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      take: 20,
    });
    await sendMessage(chatId, formatTaskList("Today's Tasks", tasks as any, "No tasks due today."));
    return;
  }

  if (command === "/priority") {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        priority: { in: ["CRITICAL", "HIGH"] },
        status: { in: ["PENDING", "IN_PROGRESS"] },
      },
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 20,
    });
    await sendMessage(chatId, formatTaskList("Priority Tasks", tasks as any, "No critical or high priority tasks."));
    return;
  }

  if (command === "/fitness") {
    const tasks = await prisma.task.findMany({
      where: {
        userId: user.id,
        tags: { some: { tag: { name: "Fitness" } } },
      },
      include: taskInclude,
      orderBy: [{ dueDate: "desc" }, { createdAt: "desc" }],
      take: 20,
    });
    await sendMessage(chatId, formatTaskList("Fitness Exercises", tasks as any, "No fitness exercises yet."));
    return;
  }

  if (command === "/tasks") {
    const tasks = await prisma.task.findMany({
      where: { userId: user.id, status: { not: "COMPLETED" } },
      include: taskInclude,
      orderBy: [{ priority: "desc" }, { sortOrder: "asc" }],
      take: 20,
    });
    await sendMessage(chatId, formatTaskList("All Open Tasks", tasks as any, "No open tasks."));
    return;
  }

  await sendMessage(chatId, `Unknown command: ${escapeHtml(command || "(empty)")}\nSend /help for options.`);
}
