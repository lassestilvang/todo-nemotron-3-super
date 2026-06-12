import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db/index';
import { taskChanges, tasks } from '@/app/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    let query = db
      .select({
        id: taskChanges.id,
        taskId: taskChanges.taskId,
        fieldChanged: taskChanges.fieldChanged,
        oldValue: taskChanges.oldValue,
        newValue: taskChanges.newValue,
        changedAt: taskChanges.changedAt,
        task: {
          id: tasks.id,
          name: tasks.name,
        },
      })
      .from(taskChanges)
      .leftJoin(tasks, eq(taskChanges.taskId, tasks.id))
      .orderBy(desc(taskChanges.changedAt))
      .limit(limit);

    if (taskId) {
      query = query.where(eq(taskChanges.taskId, taskId));
    }

    const changes = await query.execute();

    return NextResponse.json(changes);
  } catch (error) {
    console.error('Failed to fetch task changes:', error);
    return NextResponse.json({ error: 'Failed to fetch task changes' }, { status: 500 });
  }
}