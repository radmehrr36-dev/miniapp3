import { NextResponse } from "next/server";
import { getBotInfo } from "@/lib/telegram-auth";

// Reports which providers have real keys configured — so the UI can be honest.
export async function GET() {
  const providers = [
    { id: "api_9", name: "OpenRouter", live: !!process.env.OPENROUTER_API_KEY },
    { id: "api_1", name: "OpenAI", live: !!process.env.OPENAI_API_KEY },
    { id: "api_3", name: "Google Gemini", live: !!process.env.GEMINI_API_KEY },
    { id: "api_5", name: "Anthropic Claude", live: !!process.env.ANTHROPIC_API_KEY },
    { id: "api_7", name: "Mistral AI", live: !!process.env.MISTRAL_API_KEY },
  ];

  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  let telegram: any = { configured: !!token, live: false };
  if (token) {
    const info = await getBotInfo(token);
    telegram = {
      configured: true,
      live: info.ok,
      botUsername: info.botUsername,
      botName: info.botName,
      error: info.error,
    };
  }

  const anyProviderLive = providers.some((p) => p.live);

  return NextResponse.json({
    providers,
    telegram,
    anyProviderLive,
  });
}
