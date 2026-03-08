import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/services/telegram";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { chatId } = await req.json();

  if (!chatId) {
    return NextResponse.json(
      { error: "Telegram chat ID required" },
      { status: 400 }
    );
  }

  const sent = await sendMessage(
    chatId,
    `✅ <b>TaskMaster Connected!</b>\n\nYour Telegram notifications are now active.\n\nYou'll receive:\n📋 Daily task reminders\n⚠️ Overdue alerts\n📊 Weekly reports\n\n<a href="${process.env.NEXT_PUBLIC_APP_URL}">Open TaskMaster →</a>`
  );

  if (!sent) {
    return NextResponse.json(
      { error: "Failed to send test message. Check your bot token and chat ID." },
      { status: 400 }
    );
  }

  // Save chat ID to user
  await prisma.user.update({
    where: { id: session.user.id },
    data: { telegramChatId: chatId },
  });

  return NextResponse.json({ success: true });
}
