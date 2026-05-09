import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/app/lib/db/schema';
import { eq, desc, and, isNotNull, sql } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const activeTab = searchParams.get('activeTab') as 'today' | 'next7' | 'upcoming' | 'all' || 'today';
  const showCompleted = searchParams.get('showCompleted') === 'true';
  const searchQuery = searchParams.get('searchQuery') || '';
  const filterListId = searchParams.get('filterListId') || null;
  const filterLabelId = searchParams.get('filterLabelId') || null;

  try {
      // Build the base query with labels pre-fetched to avoid N+1 problem
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

      // Apply filters based on active tab
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
          // No date filter for 'all' view
          break;
      }

      // Apply completed tasks filter
      if (!showCompleted) {
        query = query.where(eq(tasks.completed, false));
      }

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.where(
          sql`${tasks.name} ILIKE '%' || ${searchQuery} || '%' OR ${tasks.description} ILIKE '%' || ${searchQuery} || '%'`
        );
      }

      // Apply list filter
      if (filterListId) {
        query = query.where(eq(tasks.listId, filterListId));
      }

      // Apply label filter
      if (filterLabelId) {
        query = query
          .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
          .where(eq(taskLabels.labelId, filterLabelId));
      }

      // Execute the query
      const results = await query.execute();

      // Fetch all labels for all tasks in a single query to avoid N+1 problem
      const taskIds = results.map((task: any) => task.id);
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
            .where(sql`${taskLabels.taskId} IN (${taskIds.map(() => '?').join(',')})`)
            .execute(taskIds)
        : [];

      // Group labels by taskId
      const labelsByTaskId: Record<string, any[]> = {};
      allTaskLabels.forEach((tl: any) => {
        if (!labelsByTaskId[tl.taskId]) {
          labelsByTaskId[tl.taskId] = [];
        }
        labelsByTaskId[tl.taskId].push({
          id: tl.id,
          name: tl.name,
          color: tl.color,
          emoji: tl.emoji,
        });
      });

      // Format results with labels
      const tasksWithLabels = results.map((task: any) => ({
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