import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions, messages } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const sessions = await db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.userId, parseInt(userId)))
      .orderBy(desc(chatSessions.updatedAt));

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, modelUsed } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const newSessions = await db
      .insert(chatSessions)
      .values({
        userId: parseInt(userId),
        title: title || 'چت جدید',
        modelUsed: modelUsed || 'auto',
      })
      .returning();

    const session = newSessions[0];

    // Create an initial welcome message in the new session
    await db.insert(messages).values({
      sessionId: session.id,
      role: 'assistant',
      content: 'سلام! چطور می‌تونم در این گفتگو کمکت کنم؟',
      apiUsed: 'system',
    });

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
