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

    await db
      .update(subtasks)
      .set({ ...body })
      .where(eq(subtasks.id, subtaskId));

    return NextResponse.json({ success: true });
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