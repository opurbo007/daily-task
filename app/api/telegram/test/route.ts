import { NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  try {
    // Get bot info to verify token works
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const result = await response.json();

    // Get webhook info
    const webhookResponse = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      bot: result.ok ? result.result : null,
      webhook: webhookResult.result,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect to Telegram" }, { status: 500 });
  }
}