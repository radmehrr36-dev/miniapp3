import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userList = await db.select().from(users).where(eq(users.id, parseInt(userId)));
    if (!userList.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: userList[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { userId, firstName, lastName, username, photoUrl, systemPrompt, defaultModel, openrouterModel, temperature, memoryEnabled } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (username !== undefined) updateData.username = username;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (defaultModel !== undefined) updateData.defaultModel = defaultModel;
    if (openrouterModel !== undefined) updateData.openrouterModel = openrouterModel;
    if (temperature !== undefined) updateData.temperature = temperature;
    if (memoryEnabled !== undefined) updateData.memoryEnabled = memoryEnabled;

    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(userId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: updated[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
