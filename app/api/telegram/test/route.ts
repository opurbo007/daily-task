import { NextResponse } from "next/server";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function GET() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: "Missing TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  try {
    // Get bot info
    const response = await fetch(`${TELEGRAM_API}/getMe`);
    const result = await response.json();

    // Get webhook info
    const webhookResponse = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const webhookResult = await webhookResponse.json();

    // Check pending updates
    const updatesResponse = await fetch(`${TELEGRAM_API}/getUpdates?limit=1`);
    const updatesResult = await updatesResponse.json();

    return NextResponse.json({
      bot: result.ok ? result.result : null,
      webhook: webhookResult.result,
      lastUpdate: updatesResult.result?.[0] || null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to connect to Telegram" }, { status: 500 });
  }
}