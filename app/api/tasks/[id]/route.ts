import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const taskResult = await db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        date: tasks.date,
        deadline: tasks.deadline,
        reminders: tasks.reminders,
        estimate: tasks.estimate,
        actualTime: tasks.actualTime,
        priority: tasks.priority,
        completed: tasks.completed,
        recurrence: tasks.recurrence,
        sortOrder: tasks.sortOrder,
        listId: tasks.listId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        list: {
          id: lists.id,
          name: lists.name,
          color: lists.color,
          emoji: lists.emoji,
        },
      })
      .from(tasks)
      .leftJoin(lists, eq(tasks.listId, lists.id))
      .where(eq(tasks.id, id))
      .limit(1);

    const taskData = taskResult[0];
    if (!taskData) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Fetch labels
    const labelsResult = await db
      .select({
        id: labels.id,
        name: labels.name,
        color: labels.color,
        emoji: labels.emoji,
      })
      .from(taskLabels)
      .innerJoin(labels, eq(taskLabels.labelId, labels.id))
      .where(eq(taskLabels.taskId, id));

    // Fetch subtasks
    const subtasksResult = await db
      .select()
      .from(subtasks)
      .where(eq(subtasks.taskId, id))
      .orderBy(subtasks.createdAt);

    const task = {
      ...taskData,
      date: taskData.date ? new Date(taskData.date) : null,
      deadline: taskData.deadline ? new Date(taskData.deadline) : null,
      createdAt: new Date(taskData.createdAt),
      updatedAt: new Date(taskData.updatedAt),
      list: taskData.list || {
        id: '',
        name: 'No List',
        color: 'bg-gray-500',
        emoji: '🔲',
      },
      labels: labelsResult,
      subtasks: subtasksResult,
    };

    return NextResponse.json(task);
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updatedTask] = await db
      .update(tasks)
      .set({ ...body, updatedAt: Date.now() })
      .where(eq(tasks.id, id))
      .returning();

    if (body.labelIds !== undefined) {
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

    return NextResponse.json(updatedTask);
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
