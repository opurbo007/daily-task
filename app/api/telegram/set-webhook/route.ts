import { NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")}/api/telegram`;

  try {
    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });

    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true, webhook: webhookUrl });
    } else {
      return NextResponse.json({ error: result.description }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to set webhook" }, { status: 500 });
  }
}