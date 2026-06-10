import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, taskLabels } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await db
      .update(tasks)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tasks.id, id));

    if (body.labelIds) {
      await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
      if (body.labelIds.length > 0) {
        const { createId } = await import('@paralleldrive/cuid2');
        await db.insert(taskLabels).values(
          body.labelIds.map((labelId: string) => ({
            id: createId(),
            taskId: id,
            labelId,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
    await db.delete(tasks).where(eq(tasks.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
