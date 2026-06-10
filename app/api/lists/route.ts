import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { lists } from '@/app/lib/db/schema';

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

    await db.insert(lists).values({ id, name, color, emoji });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to create list:', error);
    return NextResponse.json({ error: 'Failed to create list' }, { status: 500 });
  }
}
