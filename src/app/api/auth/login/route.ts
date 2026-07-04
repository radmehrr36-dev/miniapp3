import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, chatSessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { telegramId, username, firstName, lastName, photoUrl, languageCode } = body;

    if (!telegramId && !username) {
      return NextResponse.json({ error: 'telegramId or username is required' }, { status: 400 });
    }

    const identifier = telegramId || `user_${username}`;

    // Try finding existing user by telegramId or username
    let existingUsers;
    if (telegramId) {
      existingUsers = await db.select().from(users).where(eq(users.telegramId, telegramId));
    } else {
      existingUsers = await db.select().from(users).where(eq(users.username, username));
    }

    if (existingUsers && existingUsers.length > 0) {
      const user = existingUsers[0];
      // Update profile info if changed
      const updatedUser = await db
        .update(users)
        .set({
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          photoUrl: photoUrl || user.photoUrl,
          languageCode: languageCode || user.languageCode,
        })
        .where(eq(users.id, user.id))
        .returning();

      return NextResponse.json({ success: true, user: updatedUser[0], isNew: false });
    }

    // Create new user
    const newUsers = await db
      .insert(users)
      .values({
        telegramId: telegramId || null,
        username: username || `user_${Date.now()}`,
        firstName: firstName || 'کاربر',
        lastName: lastName || 'راد',
        languageCode: languageCode || 'fa',
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        systemPrompt: "تو Rad AI هستی، یک دستیار هوشمند، دوستانه و مفید. پاسخ‌هایت را به زبان فارسی و با لحنی صمیمانه بده.",
        defaultModel: "auto",
        temperature: "0.7",
        memoryEnabled: true,
      })
      .returning();

    const newUser = newUsers[0];

    // Create an initial welcome session for the new user
    await db.insert(chatSessions).values({
      userId: newUser.id,
      title: 'چت معارفه Rad AI',
      modelUsed: 'auto',
    });

    return NextResponse.json({ success: true, user: newUser, isNew: true });
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
