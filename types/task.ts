import type { tasks, lists, labels } from '@/app/lib/db/schema';

export type Task = typeof tasks.$inferSelect & {
  list: Pick<typeof lists.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>;
  labels: (Pick<typeof labels.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>)[];
  subtasks?: Array<{ id: string; name: string; completed: boolean; createdAt: Date }>;
};

export type ViewType = 'today' | 'next7' | 'upcoming' | 'all';

export type SortOption = 'newest' | 'oldest' | 'due-date' | 'priority';

export type Priority = 'none' | 'low' | 'medium' | 'high';

export type Recurrence = 'none' | 'daily' | 'weekly' | 'weekday' | 'monthly' | 'yearly' | 'custom';

export interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

export interface TaskFormData {
  name: string;
  description: string;
  listId: string;
  date: Date | null;
  deadline: Date | null;
  priority: Priority;
  recurrence: Recurrence;
  labelIds: string[];
  estimate: number | null;
  actualTime: number | null;
  reminders: string[];
}

export const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];
export const RECURRENCE_OPTIONS: Recurrence[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

export const DEFAULT_PRIORITY: Priority = 'medium';
export const DEFAULT_RECURRENCE: Recurrence = 'none';