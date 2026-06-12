import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { subtasks } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const taskSubtasks = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, id))
      .orderBy(subtasks.createdAt);

    return NextResponse.json(taskSubtasks);
  } catch (error) {
    console.error('Failed to fetch subtasks:', error);
    return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Subtask name is required' }, { status: 400 });
    }

    if (name.length > 500) {
      return NextResponse.json({ error: 'Subtask name must be 500 characters or less' }, { status: 400 });
    }

    const newSubtask = await db.insert(subtasks).values({
      id: createId(),
      taskId: id,
      name: name.trim(),
      completed: false,
    }).returning();

    return NextResponse.json(newSubtask[0]);
  } catch (error) {
    console.error('Failed to create subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}