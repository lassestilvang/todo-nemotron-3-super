import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks } from '@/app/lib/db/schema';
import { eq, desc, asc, and, isNotNull, sql, inArray } from 'drizzle-orm';
import type { SortOption } from '@/types/task';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeTab = (searchParams.get('activeTab') as 'today' | 'next7' | 'upcoming' | 'all') || 'today';
  const showCompleted = searchParams.get('showCompleted') === 'true';
  const searchQuery = searchParams.get('searchQuery') || '';
  const filterListId = searchParams.get('filterListId') || null;
  const filterLabelId = searchParams.get('filterLabelId') || null;
  const sortBy = (searchParams.get('sortBy') as SortOption) || 'newest';

  try {
    let query = db
      .select({
        id: tasks.id,
        name: tasks.name,
        description: tasks.description,
        date: tasks.date,
        deadline: tasks.deadline,
        priority: tasks.priority,
        completed: tasks.completed,
        recurrence: tasks.recurrence,
        listId: tasks.listId,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        estimate: tasks.estimate,
        actualTime: tasks.actualTime,
        list: {
          id: lists.id,
          name: lists.name,
          color: lists.color,
          emoji: lists.emoji,
        },
      })
      .from(tasks)
      .leftJoin(lists, eq(tasks.listId, lists.id))
      .orderBy(desc(tasks.createdAt));

    const now = Date.now();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const next7DaysEnd = new Date(now);
    next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
    next7DaysEnd.setHours(23, 59, 59, 999);

    switch (activeTab) {
      case 'today':
        query = query.where(
          and(
            isNotNull(tasks.date),
            sql`${tasks.date} >= ${todayStart} AND ${tasks.date} <= ${todayEnd}`
          )
        );
        break;
      case 'next7':
        query = query.where(
          and(
            isNotNull(tasks.date),
            sql`${tasks.date} >= ${todayStart} AND ${tasks.date} <= ${next7DaysEnd}`
          )
        );
        break;
      case 'upcoming':
        query = query.where(
          and(
            isNotNull(tasks.date),
            sql`${tasks.date} >= ${todayStart}`
          )
        );
        break;
      case 'all':
        break;
    }

    if (!showCompleted) {
      query = query.where(eq(tasks.completed, false));
    }

    if (searchQuery.trim()) {
      // First find labels matching the search query
      const matchingLabels = await db
        .select({ id: labels.id })
        .from(labels)
        .where(sql`${labels.name} LIKE '%' || ${searchQuery} || '%'`)
        .execute();

      const matchingLabelIds = matchingLabels.map((l: { id: string }) => l.id);

      // Build the search condition
      const searchCondition = matchingLabelIds.length > 0
        ? sql`(${tasks.name} LIKE '%' || ${searchQuery} || '%' OR ${tasks.description} LIKE '%' || ${searchQuery} || '%' OR EXISTS (SELECT 1 FROM task_labels WHERE task_labels.task_id = ${tasks.id} AND task_labels.label_id IN (${matchingLabelIds})))`
        : sql`${tasks.name} LIKE '%' || ${searchQuery} || '%' OR ${tasks.description} LIKE '%' || ${searchQuery} || '%'`;

      query = query.where(searchCondition);
    }

    if (filterListId) {
      query = query.where(eq(tasks.listId, filterListId));
    }

    if (filterLabelId) {
      query = query
        .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
        .where(eq(taskLabels.labelId, filterLabelId));
    }

    switch (sortBy) {
      case 'newest':
        query = query.orderBy(desc(tasks.createdAt));
        break;
      case 'oldest':
        query = query.orderBy(asc(tasks.createdAt));
        break;
      case 'due-date':
        query = query.orderBy(asc(tasks.deadline));
        break;
      case 'priority':
        query = query.orderBy(
          sql`CASE ${tasks.priority} 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'low' THEN 3 
            ELSE 4 END`
        );
        break;
    }

    const results = await query.execute() as Array<{
      id: string; name: string; description: string | null;
      date: Date | null; deadline: Date | null; priority: string;
      completed: boolean; recurrence: string | null; listId: string;
      createdAt: Date; updatedAt: Date;
      estimate: number | null;
      actualTime: number | null;
      list: { id: string; name: string; color: string; emoji: string } | null;
    }>;

    const taskIds = results.map(task => task.id);
    
    const allTaskLabels = taskIds.length > 0 
      ? await db
          .select({
            taskId: taskLabels.taskId,
            id: labels.id,
            name: labels.name,
            color: labels.color,
            emoji: labels.emoji,
          })
          .from(taskLabels)
          .innerJoin(labels, eq(taskLabels.labelId, labels.id))
          .where(inArray(taskLabels.taskId, taskIds))
      : [];

    const allSubtasks = taskIds.length > 0
      ? await db
          .select()
          .from(subtasks)
          .where(inArray(subtasks.taskId, taskIds))
      : [];

    const labelsByTaskId: Record<string, Array<{ id: string; name: string; color: string; emoji: string }>> = {};
    allTaskLabels.forEach((tl: { taskId: string; id: string; name: string; color: string; emoji: string }) => {
      if (!labelsByTaskId[tl.taskId]) {
        labelsByTaskId[tl.taskId] = [];
      }
      labelsByTaskId[tl.taskId]!.push({
        id: tl.id,
        name: tl.name,
        color: tl.color,
        emoji: tl.emoji,
      });
    });

    const subtasksByTaskId: Record<string, typeof subtasks.$inferSelect[]> = {};
    (allSubtasks as Array<{taskId: string}>).forEach((st) => {
      if (!subtasksByTaskId[st.taskId]) {
        subtasksByTaskId[st.taskId] = [];
      }
      subtasksByTaskId[st.taskId]!.push(st as any);
    });

    const tasksWithLabels = results.map(task => ({
      ...task,
      list: task.list || {
        id: '',
        name: 'No List',
        color: 'bg-gray-500',
        emoji: '🔲',
      },
      labels: labelsByTaskId[task.id] || [],
      subtasks: subtasksByTaskId[task.id] || [],
    }));

    return NextResponse.json(tasksWithLabels);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, listId, priority, date, deadline, recurrence, labelIds, estimate, actualTime } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 });
    }
    if (!listId || typeof listId !== 'string') {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 });
    }
    if (priority && !['high', 'medium', 'low', 'none'].includes(priority)) {
      return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
    }

    const task = await db.insert(tasks).values({
      name: name.trim(),
      description: description || null,
      listId,
      priority: priority || 'none',
      date: date ? new Date(date) : null,
      deadline: deadline ? new Date(deadline) : null,
      recurrence: recurrence || 'none',
      estimate: estimate || null,
      actualTime: actualTime || null,
    }).returning();

    if (labelIds && Array.isArray(labelIds) && labelIds.length > 0) {
      await db.insert(taskLabels).values(
        labelIds.map((labelId: string) => ({
          id: crypto.randomUUID(),
          taskId: task[0].id,
          labelId,
        }))
      );
    }

    return NextResponse.json(task[0]);
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}