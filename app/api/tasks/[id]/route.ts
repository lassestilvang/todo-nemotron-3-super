import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks, taskChanges } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

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

    // Validate priority
    if (body.priority !== undefined && body.priority !== null && !['high', 'medium', 'low', 'none'].includes(body.priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    // Validate recurrence
    if (body.recurrence !== undefined && body.recurrence !== null && !['none', 'daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom'].includes(body.recurrence)) {
      return NextResponse.json({ error: 'Invalid recurrence value' }, { status: 400 });
    }

    // Validate numeric fields
    if (body.estimate !== undefined && body.estimate !== null && (typeof body.estimate !== 'number' || body.estimate < 0)) {
      return NextResponse.json({ error: 'Estimate must be a positive number' }, { status: 400 });
    }
    if (body.actualTime !== undefined && body.actualTime !== null && (typeof body.actualTime !== 'number' || body.actualTime < 0)) {
      return NextResponse.json({ error: 'Actual time must be a positive number' }, { status: 400 });
    }

    // Validate listId if provided
    if (body.listId !== undefined && (typeof body.listId !== 'string' || body.listId.trim() === '')) {
      return NextResponse.json({ error: 'List ID must be a non-empty string' }, { status: 400 });
    }

    // Validate completed is boolean
    if (body.completed !== undefined && typeof body.completed !== 'boolean') {
      return NextResponse.json({ error: 'Completed must be a boolean' }, { status: 400 });
    }

    const updateData: any = { ...body, updatedAt: Date.now() };

    // Convert date strings to ISO format for consistency
    if (body.date !== undefined && body.date !== null) {
      const parsed = new Date(body.date);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
      }
      updateData.date = parsed.toISOString();
    }
    if (body.deadline !== undefined && body.deadline !== null) {
      const parsed = new Date(body.deadline);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Invalid deadline format' }, { status: 400 });
      }
      updateData.deadline = parsed.toISOString();
    }

    // Log changes before updating
    const oldTask = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    if (oldTask.length > 0) {
      const fieldsToLog: (keyof typeof tasks.$inferSelect)[] = ['name', 'description', 'priority', 'completed', 'date', 'deadline', 'listId', 'recurrence', 'estimate', 'actualTime'];
      for (const field of fieldsToLog) {
        if (body[field] !== undefined && body[field] !== oldTask[0][field]) {
          await db.insert(taskChanges).values({
            id: createId(),
            taskId: id,
            fieldChanged: field,
            oldValue: String(oldTask[0][field as keyof typeof oldTask[0]] ?? ''),
            newValue: String(body[field]),
          });
        }
      }
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();

    if (!updatedTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (body.labelIds !== undefined) {
      await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
      if (Array.isArray(body.labelIds) && body.labelIds.length > 0) {
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
