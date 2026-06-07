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
    CheckCircle2,
    Circle,
    Clock,
    Tag,
    ListIcon,
    Repeat,
    Timer,
    TrendingUp,
    Calendar,
    Play,
    Pause,
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
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);

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

      if (onTaskUpdate && task) {
        const updatedSubtasks = task.subtasks.map(s => 
          s.id === subtaskId ? { ...s, completed } : s
        );
        onTaskUpdate({ ...task, subtasks: updatedSubtasks } as any);
      }
      
      toast.success(`Subtask marked as ${completed ? 'complete' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle subtask completion:', error);
      toast.error('Failed to toggle subtask');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!window.confirm('Delete this subtask?')) return;
    
    setIsSaving(true);
    try {
      await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
      setTask(prev => prev ? { 
        ...prev, 
        subtasks: prev.subtasks.filter(s => s.id !== subtaskId) 
      } : null);
      toast.success('Subtask deleted');
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      toast.error('Failed to delete subtask');
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAddSubtask = async () => {
    if (!newSubtaskName.trim() || !task) return;
    
    setIsSaving(true);
    try {
      const newSubtask = {
        id: createId(),
        taskId: task.id,
        name: newSubtaskName.trim(),
        completed: false,
        createdAt: new Date(),
      };
      
      await db.insert(subtasks).values(newSubtask);
      setTask(prev => prev ? { 
        ...prev, 
        subtasks: [...prev.subtasks, newSubtask as any] 
      } : null);
      setNewSubtaskName('');
      toast.success('Subtask added');
    } catch (error) {
      console.error('Failed to add subtask:', error);
      toast.error('Failed to add subtask');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    setTimerStart(new Date());
  };

  const handleStopTimer = async () => {
    if (!timerStart || !task) return;
    
    const elapsed = Math.floor((Date.now() - timerStart.getTime()) / 60000);
    const newActualTime = (task.actualTime || 0) + elapsed;
    
    setIsTimerRunning(false);
    setTimerStart(null);
    
    try {
      await db.update(tasks).set({ actualTime: newActualTime }).where(eq(tasks.id, task.id));
      setTask(prev => prev ? { ...prev, actualTime: newActualTime } : null);
      toast.success(`Added ${elapsed} minutes`);
    } catch (error) {
      console.error('Failed to update time:', error);
      toast.error('Failed to update time');
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
                <span className={new Date(task.deadline).toDateString() === new Date().toDateString() ? 'font-bold text-red-500' : new Date(task.deadline) < new Date(Date.now()) ? 'text-red-500' : ''}>
                  {new Date(task.deadline).toDateString() === new Date().toDateString() ? 'Due Today' : task.deadline.toLocaleString()}
                </span>
              </div>
            )}
            {task.estimate && (
              <div className="flex items-center gap-1.5">
                <Timer className="h-3 w-3" />
                <span>Est: {formatTimeHHMM(task.estimate)}</span>
              </div>
            )}
            {task.actualTime !== null && task.actualTime > 0 && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3" />
                <span>Actual: {formatTimeHHMM(task.actualTime)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isTimerRunning ? 'destructive' : 'outline'}
              size="sm"
              onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
            >
              {isTimerRunning ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Start Timer
                </>
              )}
            </Button>
            {isTimerRunning && timerStart && (
              <span className="text-xs text-muted-foreground">
                Running: {formatTimeHHMM(Math.floor((Date.now() - timerStart.getTime()) / 60000))}
              </span>
            )}
          </div>

          {task.subtasks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Subtasks
                </span>
                <span className="font-medium">
                  {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
                </span>
              </div>
              <div className="h-2 bg-muted rounded overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}

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
                onKeyDown={(e) => { if (e.key === 'Enter') handleQuickAddSubtask(); }}
              />
              <Button onClick={handleQuickAddSubtask} disabled={!newSubtaskName.trim() || isSaving} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {task.subtasks.length > 0 ? (
              <>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtasks ({task.subtasks.filter(s => s.completed).length}/{task.subtasks.length})</span>
                  <span>{Math.round((task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden mb-2">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%` }}
                  />
                </div>
                <div className="space-y-2">
                  {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-start gap-3">
                    <Checkbox
                      checked={Boolean(subtask.completed)}
                      onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, checked === true)}
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          disabled={isSaving}
                          className="h-6 px-2"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
</div>
                  ))}
                </div>
              </>
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