import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, taskLabels } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { sendError } from '@/lib/validation';

const VALID_ACTIONS = ['complete', 'incomplete', 'delete'] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return sendError('No task IDs provided', 400);
    }

    if (!VALID_ACTIONS.includes(action)) {
      return sendError('Invalid action', 400);
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
      case 'delete': {
        const tasksToDelete = await db
          .select({ id: tasks.id, name: tasks.name })
          .from(tasks)
          .where(inArray(tasks.id, taskIds));
        await db.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds));
        await db.delete(tasks).where(inArray(tasks.id, taskIds));
        return NextResponse.json({
          success: true,
          action,
          count: taskIds.length,
          deletedTasks: tasksToDelete,
        });
      }
    }

    return NextResponse.json({ success: true, action, count: taskIds.length });
  } catch (error) {
    console.error('Failed to perform bulk action:', error);
    return sendError('Failed to perform bulk action', 500);
  }
}