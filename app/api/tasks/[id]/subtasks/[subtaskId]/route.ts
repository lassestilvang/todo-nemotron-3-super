import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { subtasks } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { subtaskId } = await params;
    const body = await request.json();

    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 });
      }
      if (body.name.length > 500) {
        return NextResponse.json({ error: 'Name must be 500 characters or less' }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== 'boolean') {
        return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
      }
      updateData.completed = body.completed;
    }

    const [updatedSubtask] = await db
      .update(subtasks)
      .set(updateData)
      .where(eq(subtasks.id, subtaskId))
      .returning();

    if (!updatedSubtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    return NextResponse.json(updatedSubtask);
  } catch (error) {
    console.error('Failed to update subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const { subtaskId } = await params;

    await db.delete(subtasks).where(eq(subtasks.id, subtaskId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}