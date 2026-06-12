import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { labels } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  validateRequired,
  validateString,
  sendError,
  sendSuccess,
} from '@/lib/validation';

export async function GET() {
  try {
    const result = await db.select().from(labels);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch labels:', error);
    return sendError('Failed to fetch labels', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color, emoji } = body;

    const nameError = validateRequired(name, 'Name') || validateString(name, 'Name', 100);
    if (nameError) return sendError(nameError, 400);

    const colorError = validateRequired(color, 'Color');
    if (colorError) return sendError(colorError, 400);

    const emojiError = validateRequired(emoji, 'Emoji');
    if (emojiError) return sendError(emojiError, 400);

    const existing = await db.select().from(labels).where(eq(labels.name, name.trim())).limit(1);
    if (existing.length > 0) {
      return sendError('A label with this name already exists', 409);
    }

    await db.insert(labels).values({ id, name: name.trim(), color, emoji });
    return sendSuccess({ success: true, id });
  } catch (error) {
    console.error('Failed to create label:', error);
    return sendError('Failed to create label', 500);
  }
}