'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks, attachments, taskChanges } from '@/app/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';

import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { RECURRENCE_OPTIONS } from '@/lib/constants';
import { 
  Loader,
  Plus,
  Clock,
  Tag,
  ListIcon,
  Repeat,
  Timer,
} from 'lucide-react';
import { createId } from '@paralleldrive/cuid2';
import { formatTimeHHMM, parseHHMMtoMinutes } from '@/lib/utils';
import type { Task } from '@/types/task';

const TaskDetails = ({ 
  taskId, 
  onClose, 
  onTaskUpdate
}: { 
  taskId: string; 
  onClose: () => void; 
  onTaskUpdate?: (updatedTask: any) => void; 
}) => {
  const [task, setTask] = useState<
    | (typeof tasks.$inferSelect & {
        list: Pick<typeof lists.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>;
        labels: (Pick<typeof labels.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>)[];
        subtasks: typeof subtasks.$inferSelect[];
        attachments: typeof attachments.$inferSelect[];
        changes: typeof taskChanges.$inferSelect[];
      })
    | null
  >(null);
  const [editData, setEditData] = useState<{
    name: string;
    description: string;
    date: Date | null;
    deadline: Date | null;
    priority: string;
    recurrence: string;
    estimate: string;
    actualTime: string;
  }>({
    name: '',
    description: '',
    date: null,
    deadline: null,
    priority: 'none',
    recurrence: 'none',
    estimate: '00:00',
    actualTime: '00:00',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState('');

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim() || !task) return;
    
    setIsSaving(true);
    try {
      await db.insert(subtasks).values({
        id: createId(),
        taskId: task.id,
        name: newSubtaskName.trim(),
        completed: false,
      });
      
      toast.success('Subtask added');
      setNewSubtaskName('');
      
      // Refresh the task to get updated subtasks
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
        .where(eq(tasks.id, taskId))
        .limit(1);

      const taskData = taskResult[0];
      if (taskData) {
        const labelsResult = await db
          .select({
            id: labels.id,
            name: labels.name,
            color: labels.color,
            emoji: labels.emoji,
          })
          .from(taskLabels)
          .innerJoin(labels, eq(taskLabels.labelId, labels.id))
          .where(eq(taskLabels.taskId, taskId));

        const subtasksResult = await db
          .select()
          .from(subtasks)
          .where(eq(subtasks.taskId, taskId))
          .orderBy(desc(subtasks.createdAt));

        const attachmentsResult = await db
          .select()
          .from(attachments)
          .where(eq(attachments.taskId, taskId))
          .orderBy(desc(attachments.uploadedAt));

        const changesResult = await db
          .select()
          .from(taskChanges)
          .where(eq(taskChanges.taskId, taskId))
          .orderBy(desc(taskChanges.changedAt))
          .limit(50);

setTask({
          id: taskData.id,
          name: taskData.name,
          description: taskData.description,
          date: taskData.date ? new Date(taskData.date) : null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          reminders: taskData.reminders,
          estimate: taskData.estimate,
          actualTime: taskData.actualTime,
          priority: taskData.priority,
          completed: !!taskData.completed,
          recurrence: taskData.recurrence,
          listId: taskData.listId,
          createdAt: new Date(taskData.createdAt),
          updatedAt: new Date(taskData.updatedAt),
          sortOrder: taskData.sortOrder ?? 0,
          list: taskData.list || {
            id: '',
            name: 'No List',
            color: 'bg-gray-500',
            emoji: '🔲',
          },
          labels: labelsResult,
          subtasks: subtasksResult,
          attachments: attachmentsResult,
          changes: changesResult,
        });
      }
    } catch (error) {
      console.error('Failed to add subtask:', error);
      toast.error('Failed to add subtask');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const loadTask = async () => {
      setIsLoading(true);
      try {
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
          .where(eq(tasks.id, taskId))
          .limit(1);

       const taskData = taskResult[0];
       if (!taskData) {
         toast.error('Task not found');
         onClose();
         return;
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
          .where(eq(taskLabels.taskId, taskId));

        // Fetch subtasks
        const subtasksResult = await db
          .select()
          .from(subtasks)
          .where(eq(subtasks.taskId, taskId))
          .orderBy(desc(subtasks.createdAt));

        // Fetch attachments
        const attachmentsResult = await db
          .select()
          .from(attachments)
          .where(eq(attachments.taskId, taskId))
          .orderBy(desc(attachments.uploadedAt));

        // Fetch recent changes (last 50)
        const changesResult = await db
          .select()
          .from(taskChanges)
          .where(eq(taskChanges.taskId, taskId))
          .orderBy(desc(taskChanges.changedAt))
          .limit(50);

setTask({
          id: taskData.id,
          name: taskData.name,
          description: taskData.description,
          date: taskData.date ? new Date(taskData.date) : null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          reminders: taskData.reminders,
          estimate: taskData.estimate,
          actualTime: taskData.actualTime,
          priority: taskData.priority,
          completed: !!taskData.completed,
          recurrence: taskData.recurrence,
          listId: taskData.listId,
          createdAt: new Date(taskData.createdAt),
          updatedAt: new Date(taskData.updatedAt),
          sortOrder: taskData.sortOrder ?? 0,
          list: taskData.list || {
            id: '',
            name: 'No List',
            color: 'bg-gray-500',
            emoji: '🔲',
          },
          labels: labelsResult,
          subtasks: subtasksResult,
          attachments: attachmentsResult,
          changes: changesResult,
        });

        setEditData({
          name: taskData.name,
          description: taskData.description || '',
          date: taskData.date ? new Date(taskData.date) : null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          priority: taskData.priority ?? 'none',
          recurrence: taskData.recurrence ?? 'none',
          estimate: taskData.estimate 
            ? formatTimeHHMM(taskData.estimate)
            : '00:00',
          actualTime: taskData.actualTime 
            ? formatTimeHHMM(taskData.actualTime)
            : '00:00',
        });
      } catch (error) {
        console.error('Failed to load task:', error);
        toast.error('Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    if (taskId) {
      loadTask();
    }
  }, [taskId, onClose]);

  const handleSave = async () => {
    if (!editData.name.trim()) {
      toast.error('Task name is required');
      return;
    }

setIsSaving(true);
    try {
      const data: any = {
        name: editData.name,
        description: editData.description,
        priority: editData.priority,
        recurrence: editData.recurrence,
      };

      if (editData.date) {
        data.date = editData.date.getTime();
      } else {
        data.date = null;
      }

      if (editData.deadline) {
        data.deadline = editData.deadline.getTime();
      } else {
        data.deadline = null;
      }

      data.estimate = parseHHMMtoMinutes(editData.estimate);
      data.actualTime = parseHHMMtoMinutes(editData.actualTime);

      await db.update(tasks).set(data).where(eq(tasks.id, taskId));

      toast.success('Task saved successfully');
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsSaving(true);
    try {
      await db.delete(tasks).where(eq(tasks.id, taskId));
      toast.success('Task deleted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    setIsSaving(true);
    try {
      await db
        .update(subtasks)
        .set({ completed })
        .where(eq(subtasks.id, subtaskId));

      toast.success(`Subtask marked as ${completed ? 'complete' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle subtask completion:', error);
      toast.error('Failed to toggle subtask');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;

    setIsSaving(true);
    try {
      await db
        .update(tasks)
        .set({ completed: !task.completed })
        .where(eq(tasks.id, taskId));

      toast.success(`Task marked as ${task.completed ? 'incomplete' : 'complete'}`);
      onClose();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      toast.error('Failed to toggle task completion');
    } finally {
      setIsSaving(false);
    }
  };

    if (isLoading) {
      return (
        <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
          <DialogContent className="w-[500px]">
            <DialogHeader>
              <DialogTitle>Loading...</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-sm">Loading task details...</p>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

   if (!task) {
     return (
       <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
          <DialogContent className="w-[500px]">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
           <div className="flex flex-col items-center justify-center py-8">
             <p className="text-center py-8">Task not found</p>
             <DialogFooter>
               <Button variant="outline" onClick={onClose}>
                 Close
               </Button>
             </DialogFooter>
           </div>
         </DialogContent>
       </Dialog>
     );
   }

    return (
      <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="w-[600px] p-6 space-y-6">
          <DialogHeader>
            <DialogTitle>{task.name}</DialogTitle>
            <p className="text-muted-foreground">{task.description}</p>
          </DialogHeader>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.list && (
              <div className="flex items-center gap-1.5">
                <div className={`h-5 w-5 flex items-center justify-center rounded ${task.list.color}`}>
                  {task.list.emoji}
                </div>
                <span>{task.list.name}</span>
              </div>
            )}
            {task.date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                <span>{task.date.toLocaleDateString()}</span>
              </div>
            )}
            {task.deadline && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{task.deadline.toLocaleString()}</span>
              </div>
            )}
            {task.estimate && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-3 w-3" />
                <span>{formatTimeHHMM(task.estimate)}</span>
              </div>
            )}
          </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3 border-b">
            <TabsTrigger value="details" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-muted-foreground/80 data-[state=active]:border-b-2 data-[state=active]:text-foreground">
              Details
            </TabsTrigger>
            <TabsTrigger value="subtasks" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-muted-foreground/80 data-[state=active]:border-b-2 data-[state=active]:text-foreground">
              Subtasks
            </TabsTrigger>
            <TabsTrigger value="activity" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-muted-foreground/80 data-[state=active]:border-b-2 data-[state=active]:text-foreground">
              Activity
            </TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-2 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-task-name">Task Name</Label>
                <Input
                  id="edit-task-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-description">Description</Label>
                <Textarea
                  id="edit-task-description"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-task-date">Date</Label>
                  <input
                    id="edit-task-date"
                    type="date"
                    value={editData.date ? editData.date.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setEditData({ ...editData, date });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-task-deadline">Deadline</Label>
                  <input
                    id="edit-task-deadline"
                    type="datetime-local"
                    value={editData.deadline ? editData.deadline.toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setEditData({ ...editData, deadline: date });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-priority">Priority</Label>
                <select
                  id="edit-task-priority"
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-task-recurrence">Recurrence</Label>
                <select
                  id="edit-task-recurrence"
                  value={editData.recurrence}
                  onChange={(e) => setEditData({ ...editData, recurrence: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-task-estimate">Estimated Time</Label>
                  <input
                    id="edit-task-estimate"
                    type="text"
                    value={editData.estimate}
                    onChange={(e) => setEditData({ ...editData, estimate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-task-actualTime">Actual Time</Label>
                  <input
                    id="edit-task-actualTime"
                    type="text"
                    value={editData.actualTime}
                    onChange={(e) => setEditData({ ...editData, actualTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:MM"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="subtasks" className="mt-2">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Add subtask..."
                value={newSubtaskName}
                onChange={(e) => setNewSubtaskName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask(); }}
              />
              <Button onClick={handleAddSubtask} disabled={!newSubtaskName.trim() || isSaving} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {task.subtasks.length > 0 ? (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-start gap-3">
                      <Checkbox
                        checked={Boolean(subtask.completed)}
                        onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, checked === true)}
                        className="flex-shrink-0"
                      />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.name}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No subtasks</p>
            )}
          </TabsContent>
<TabsContent value="activity" className="mt-2">
            {task.changes.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {task.changes.map((change) => (
                  <div key={change.id} className="border p-3 rounded text-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-medium">{change.fieldChanged}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(change.changedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No activity</p>
            )}
          </TabsContent>
          </Tabs>
          <DialogFooter className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSaving}
            >
              {isSaving ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
   );
};

export default TaskDetails;