import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskIds } = body as { taskIds: string[] };

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'No task IDs provided' }, { status: 400 });
    }

    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      if (taskId) {
        await db
          .update(tasks)
          .set({ sortOrder: i, updatedAt: Date.now() })
          .where(eq(tasks.id, taskId));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
