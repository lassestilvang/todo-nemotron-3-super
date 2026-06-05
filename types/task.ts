import type { tasks, lists, labels } from '@/app/lib/db/schema';

export type Task = typeof tasks.$inferSelect & {
  list: Pick<typeof lists.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>;
  labels: (Pick<typeof labels.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>)[];
};

export type ViewType = 'today' | 'next7' | 'upcoming' | 'all';