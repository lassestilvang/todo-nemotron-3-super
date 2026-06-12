import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendError } from '@/lib/validation';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { taskIds } = body as { taskIds: string[] };

    if (!Array.isArray(taskIds)) {
      return sendError('taskIds must be an array', 400);
    }

    if (taskIds.length === 0) {
      return sendError('taskIds array cannot be empty', 400);
    }

    for (const taskId of taskIds) {
      if (typeof taskId !== 'string' || taskId.trim() === '') {
        return sendError('Each task ID must be a non-empty string', 400);
      }
    }

    const validTaskIds = taskIds.filter((id): id is string => !!id && typeof id === 'string');
    const uniqueTaskIds = [...new Set(validTaskIds)];
    if (uniqueTaskIds.length !== taskIds.length) {
      return sendError('Duplicate task IDs are not allowed', 400);
    }

    const updatedTaskIds: string[] = [];
    const failedTaskIds: string[] = [];

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
        } else {
          failedTaskIds.push(taskId);
        }
      } catch (error) {
        console.error(`Failed to update task ${taskId}:`, error);
        failedTaskIds.push(taskId);
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: updatedTaskIds.length,
      failedCount: failedTaskIds.length,
      failedTaskIds,
    });
  } catch (error) {
    console.error('Failed to reorder tasks:', error);
    return sendError('Failed to reorder tasks', 500);
  }
}