import { NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`);
    const result = await response.json();

    if (result.ok) {
      return NextResponse.json({ success: true, message: "Webhook deleted. Re-run /api/telegram/set-webhook to set it again." });
    } else {
      return NextResponse.json({ error: result.description }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 });
  }
}