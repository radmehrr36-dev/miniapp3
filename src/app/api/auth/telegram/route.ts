import { NextResponse } from 'next/server';
import { db } from "@/db";
import { users, chatSessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyTelegramInitData, getBotInfo } from "@/lib/telegram-auth";

// GET handler
export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  if (!token) {
    return NextResponse.json({
      configured: false,
      message: "توکن ربات تلگرام تنظیم نشده است. مقدار TELEGRAM_BOT_TOKEN را در فایل .env قرار دهید.",
    });
  }
  const info = await getBotInfo(token);
  return NextResponse.json({
    configured: true,
    live: info.ok,
    botUsername: info.botUsername,
    botName: info.botName,
    error: info.error,
  });
}

// POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { initData } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN || "";
    if (!token) {
      return NextResponse.json(
        { error: "سرور توکن ربات تلگرام را ندارد. لطفاً TELEGRAM_BOT_TOKEN را تنظیم کنید." },
        { status: 503 }
      );
    }

    const verified = verifyTelegramInitData(initData, token);
    if (!verified.ok || !verified.user) {
      return NextResponse.json(
        { error: verified.error || "اعتبارسنجی داده‌های تلگرام ناموفق بود." },
        { status: 401 }
      );
    }

    const tgUser = verified.user;
    const telegramId = String(tgUser.id);

    const existing = await db.select().from(users).where(eq(users.telegramId, telegramId));

    if (existing.length > 0) {
      const u = existing[0];
      const updated = await db
        .update(users)
        .set({
          username: tgUser.username || u.username,
          firstName: tgUser.first_name || u.firstName,
          lastName: tgUser.last_name || u.lastName,
          languageCode: tgUser.language_code || u.languageCode,
          photoUrl: tgUser.photo_url || u.photoUrl,
          isPremium: tgUser.is_premium ?? u.isPremium,
          authSource: "telegram",
        })
        .where(eq(users.id, u.id))
        .returning();
      return NextResponse.json({ success: true, user: updated[0], isNew: false, verified: true });
    }

    const created = await db
      .insert(users)
      .values({
        telegramId,
        username: tgUser.username || `tg_${telegramId}`,
        firstName: tgUser.first_name || "کاربر",
        lastName: tgUser.last_name || "",
        languageCode: tgUser.language_code || "fa",
        photoUrl: tgUser.photo_url || null,
        isPremium: tgUser.is_premium ?? false,
        authSource: "telegram",
      })
      .returning();

    const newUser = created[0];
    await db.insert(chatSessions).values({
      userId: newUser.id,
      title: "چت معارفه Rad AI",
      modelUsed: "auto",
    });

    return NextResponse.json({ success: true, user: newUser, isNew: true, verified: true });
  } catch (error: any) {
    console.error("Telegram auth error:", error);
    return NextResponse.json({ error: error.message || "خطای داخلی سرور" }, { status: 500 });
  }
}