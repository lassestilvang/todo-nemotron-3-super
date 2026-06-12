import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskIds } = body as { taskIds: string[] };

    // Validate taskIds is an array
    if (!Array.isArray(taskIds)) {
      return NextResponse.json({ error: 'taskIds must be an array' }, { status: 400 });
    }

    // Validate array is not empty
    if (taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds array cannot be empty' }, { status: 400 });
    }

    // Validate each task ID is a non-empty string
    for (const taskId of taskIds) {
      if (typeof taskId !== 'string' || taskId.trim() === '') {
        return NextResponse.json({ error: 'Each task ID must be a non-empty string' }, { status: 400 });
      }
    }

    // Remove duplicates and validate order
    const validTaskIds = taskIds.filter((id): id is string => !!id && typeof id === 'string');
    const uniqueTaskIds = [...new Set(validTaskIds)];
    if (uniqueTaskIds.length !== taskIds.length) {
      return NextResponse.json({ error: 'Duplicate task IDs are not allowed' }, { status: 400 });
    }

    // Update tasks in a transaction-like manner
    const updatedTaskIds: string[] = [];
    for (let i = 0; i < uniqueTaskIds.length; i++) {
      const taskId = uniqueTaskIds[i];
      if (!taskId) continue;
      try {
        const [updatedTask] = await db
          .update(tasks)
          .set({ sortOrder: i, updatedAt: Date.now() })
          .where(eq(tasks.id, taskId))
          .returning();

        if (updatedTask) {
          updatedTaskIds.push(taskId);
        }
      } catch (error) {
        console.error(`Failed to update task ${taskId}:`, error);
        // Continue with other tasks, but track failures
      }
    }

    return NextResponse.json({ success: true, updatedCount: updatedTaskIds.length });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return NextResponse.json({ error: 'Failed to reorder tasks' }, { status: 500 });
  }
}
