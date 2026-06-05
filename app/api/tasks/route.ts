import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/app/lib/db/schema';
import { eq, desc, and, isNotNull, sql, inArray } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeTab = searchParams.get('activeTab') as 'today' | 'next7' | 'upcoming' | 'all' || 'today';
  const showCompleted = searchParams.get('showCompleted') === 'true';
  const searchQuery = searchParams.get('searchQuery') || '';
  const filterListId = searchParams.get('filterListId') || null;
  const filterLabelId = searchParams.get('filterLabelId') || null;

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
      query = query.where(
        sql`${tasks.name} LIKE '%' || ${searchQuery} || '%' OR ${tasks.description} LIKE '%' || ${searchQuery} || '%'`
      );
    }

    if (filterListId) {
      query = query.where(eq(tasks.listId, filterListId));
    }

    if (filterLabelId) {
      query = query
        .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
        .where(eq(taskLabels.labelId, filterLabelId));
    }

    const results = await query.execute() as Array<{
      id: string; name: string; description: string | null;
      date: Date | null; deadline: Date | null; priority: string;
      completed: boolean; recurrence: string | null; listId: string;
      createdAt: Date; updatedAt: Date;
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

    const tasksWithLabels = results.map(task => ({
      ...task,
      list: task.list || {
        id: '',
        name: 'No List',
        color: 'bg-gray-500',
        emoji: '🔲',
      },
      labels: labelsByTaskId[task.id] || [],
    }));

    return NextResponse.json(tasksWithLabels);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}