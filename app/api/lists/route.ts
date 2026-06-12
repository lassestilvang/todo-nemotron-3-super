import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { lists } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select().from(lists);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch lists:', error);
    return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color, emoji } = body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required and must be a non-empty string' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or less' }, { status: 400 });
    }

    // Validate color (should be a Tailwind color class or hex)
    if (!color || typeof color !== 'string' || color.trim() === '') {
      return NextResponse.json({ error: 'Color is required' }, { status: 400 });
    }

    // Validate emoji
    if (!emoji || typeof emoji !== 'string' || emoji.trim() === '') {
      return NextResponse.json({ error: 'Emoji is required' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await db.select().from(lists).where(eq(lists.name, name.trim())).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ error: 'A list with this name already exists' }, { status: 409 });
    }

    await db.insert(lists).values({ id, name: name.trim(), color, emoji });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
