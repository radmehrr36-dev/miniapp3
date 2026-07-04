import { NextResponse } from 'next/server';
import { db } from '@/db';
import { chatSessions, messages } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    const sessionList = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));
    if (!sessionList.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      success: true,
      session: sessionList[0],
      messages: sessionMessages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);
    const body = await req.json();
    const { title, modelUsed } = body;

    const updateData: any = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (modelUsed !== undefined) updateData.modelUsed = modelUsed;

    const updated = await db
      .update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, sessionId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, session: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    // Messages have onDelete: cascade in postgres schema, but let's explicitly delete them if needed or rely on cascade
    await db.delete(messages).where(eq(messages.sessionId, sessionId));
    const deleted = await db.delete(chatSessions).where(eq(chatSessions.id, sessionId)).returning();

    if (!deleted.length) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: sessionId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
