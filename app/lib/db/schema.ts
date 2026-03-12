import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const lists = sqliteTable('lists', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  color: text('color').notNull(), // Tailwind color class
  emoji: text('emoji').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
});

export const labels = sqliteTable('labels', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  color: text('color').notNull(), // Tailwind color class
  emoji: text('emoji').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
});

export const tasks = sqliteTable('tasks', {
   id: text('id').primaryKey().$defaultFn(() => createId()),
   listId: text('list_id').notNull().references(() => lists.id),
   name: text('name').notNull(),
   description: text('description'),
   date: integer('date', { mode: 'timestamp' }), // Scheduled date
   deadline: integer('deadline', { mode: 'timestamp' }), // Deadline date/time
   reminders: text('reminders'), // JSON array of reminder timestamps
   estimate: integer('estimate'), // Estimated time in minutes
   actualTime: integer('actual_time'), // Actual time spent in minutes
   priority: text('priority', { enum: ['high', 'medium', 'low', 'none'] }).default('none'),
   completed: integer('completed', { mode: 'boolean' }).default(false),
   recurrence: text('recurrence'), // e.g., 'daily', 'weekly', 'monthly', 'yearly', 'custom'
   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
 });

export const taskLabels = sqliteTable('task_labels', {
   id: text('id').primaryKey().$defaultFn(() => createId()),
   taskId: text('task_id')
     .notNull()
     .references(() => tasks.id),
   labelId: text('label_id')
     .notNull()
     .references(() => labels.id),
 });

export const subtasks = sqliteTable('subtasks', {
   id: text('id').primaryKey().$defaultFn(() => createId()),
   taskId: text('task_id')
     .notNull()
     .references(() => tasks.id),
   name: text('name').notNull(),
   completed: integer('completed', { mode: 'boolean' }).default(false),
   createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
   updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
 });

export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(), // Path to stored file
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
});

export const taskChanges = sqliteTable('task_changes', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id),
  fieldChanged: text('field_changed').notNull(), // e.g., 'name', 'completed', 'priority'
  oldValue: text('old_value'),
  newValue: text('new_value'),
  changedAt: integer('changed_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
});

// Indexes for performance
export const tasksListIdIndex = sqliteTable('tasks_list_id_index', {
  listId: text('list_id').notNull(),
}).createIndex('tasks_list_id_idx', (t) => [t.listId]);

export const tasksDateIndex = sqliteTable('tasks_date_index', {
  date: integer('date', { mode: 'timestamp' }),
}).createIndex('tasks_date_idx', (t) => [t.date]);

export const tasksDeadlineIndex = sqliteTable('tasks_deadline_index', {
  deadline: integer('deadline', { mode: 'timestamp' }),
}).createIndex('tasks_deadline_idx', (t) => [t.deadline]);

export const tasksCompletedIndex = sqliteTable('tasks_completed_index', {
   completed: integer('completed', { mode: 'boolean' }),
}).createIndex('tasks_completed_idx', (t) => [t.completed]);
