import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, taskLabels } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'No task IDs provided' }, { status: 400 });
    }

    switch (action) {
      case 'complete':
        await db
          .update(tasks)
          .set({ completed: true, updatedAt: Date.now() })
          .where(inArray(tasks.id, taskIds));
        break;
      case 'incomplete':
        await db
          .update(tasks)
          .set({ completed: false, updatedAt: Date.now() })
          .where(inArray(tasks.id, taskIds));
        break;
      case 'delete':
        await db.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds));
        await db.delete(tasks).where(inArray(tasks.id, taskIds));
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, count: taskIds.length });
  } catch (error) {
    console.error('Failed to perform bulk action:', error);
    return NextResponse.json({ error: 'Failed to perform bulk action' }, { status: 500 });
  }
}
