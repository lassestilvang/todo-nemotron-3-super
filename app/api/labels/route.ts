import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { labels } from '@/app/lib/db/schema';

export async function GET() {
  try {
    const result = await db.select().from(labels);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, color, emoji } = body;

    await db.insert(labels).values({ id, name, color, emoji });
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to create label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}
