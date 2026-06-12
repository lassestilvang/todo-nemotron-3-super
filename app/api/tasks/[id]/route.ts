import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks, taskChanges } from '@/app/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
  validateEnum,
  validatePositiveNumber,
  validateBoolean,
  validateDate,
  sendError,
} from '@/lib/validation';

const PRIORITY_VALUES = ['high', 'medium', 'low', 'none'] as const;
const RECURRENCE_VALUES = ['none', 'daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom'] as const;

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
      return sendError('Task not found', 404);
    }

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
    return sendError('Failed to fetch task', 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const priorityError = validateEnum(body.priority, 'priority', [...PRIORITY_VALUES]);
    if (priorityError) return sendError(priorityError, 400);

    const recurrenceError = validateEnum(body.recurrence, 'recurrence', [...RECURRENCE_VALUES]);
    if (recurrenceError) return sendError(recurrenceError, 400);

    const estimateError = validatePositiveNumber(body.estimate, 'Estimate');
    if (estimateError) return sendError(estimateError, 400);

    const actualTimeError = validatePositiveNumber(body.actualTime, 'Actual time');
    if (actualTimeError) return sendError(actualTimeError, 400);

    const listIdError = body.listId !== undefined && (typeof body.listId !== 'string' || body.listId.trim() === '');
    if (listIdError) return sendError('List ID must be a non-empty string', 400);

    const completedError = validateBoolean(body.completed, 'Completed');
    if (completedError) return sendError(completedError, 400);

    const updateData: any = { ...body, updatedAt: Date.now() };

    if (body.date !== undefined && body.date !== null) {
      const parsed = new Date(body.date);
      if (isNaN(parsed.getTime())) {
        return sendError('Invalid date format', 400);
      }
      updateData.date = parsed.toISOString();
    }
    if (body.deadline !== undefined && body.deadline !== null) {
      const parsed = new Date(body.deadline);
      if (isNaN(parsed.getTime())) {
        return sendError('Invalid deadline format', 400);
      }
      updateData.deadline = parsed.toISOString();
    }

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
      return sendError('Task not found', 404);
    }

    if (body.labelIds !== undefined) {
      await db.delete(taskLabels).where(eq(taskLabels.taskId, id));
      if (Array.isArray(body.labelIds) && body.labelIds.length > 0) {
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
    return sendError('Failed to update task', 500);
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
    return sendError('Failed to delete task', 500);
  }
}