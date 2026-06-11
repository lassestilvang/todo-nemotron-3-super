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
    History,
    ExternalLink,
    BookOpen,
    X,
  } from 'lucide-react';
import { createId } from '@paralleldrive/cuid2';
import { formatTimeHHMM, parseHHMMtoMinutes } from '@/lib/utils';
import type { Task } from '@/types/task';
import confetti from 'canvas-confetti';

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
      if (!task.completed) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 999,
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        });
      }

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
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
          <div className="flex flex-col h-[85vh]">
            {/* Header Area */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1 flex-1 pr-8">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${task.list.color} text-white`}>
                      {task.list.emoji} {task.list.name}
                    </span>
                    {task.priority && task.priority !== 'none' && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.priority === 'high' ? 'bg-red-500 text-white' :
                        task.priority === 'medium' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
                    {task.name}
                  </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {task.date && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{task.date.toLocaleDateString()}</span>
                  </div>
                )}
                {task.deadline && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    new Date(task.deadline) < new Date() && !task.completed
                      ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{task.deadline.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant={isTimerRunning ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={isTimerRunning ? handleStopTimer : handleStartTimer}
                    className="h-8 rounded-full"
                  >
                    {isTimerRunning ? <Pause className="h-3.5 w-3.5 mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                    {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
                  </Button>
                  {isTimerRunning && (
                    <span className="text-xs font-mono font-bold text-red-500 animate-pulse">
                      {formatTimeHHMM(Math.floor((Date.now() - (timerStart?.getTime() || Date.now())) / 60000))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs defaultValue="details" className="flex flex-col h-full">
                <div className="px-8 border-b border-slate-100 dark:border-slate-900">
                  <TabsList className="bg-transparent h-12 gap-6 p-0">
                    <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="subtasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                      Subtasks ({task.subtasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                      Notes
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                      Activity
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto px-8 py-6">
                  <TabsContent value="details" className="mt-0 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Name</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Priority</Label>
                        <select
                          value={editData.priority}
                          onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm"
                        >
                          <option value="none">None</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Schedule Date</Label>
                        <input
                          type="date"
                          value={editData.date ? editData.date.toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditData({ ...editData, date: e.target.value ? new Date(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Deadline</Label>
                        <input
                          type="datetime-local"
                          value={editData.deadline ? editData.deadline.toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditData({ ...editData, deadline: e.target.value ? new Date(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Recurrence</Label>
                        <select
                          value={editData.recurrence}
                          onChange={(e) => setEditData({ ...editData, recurrence: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md text-sm"
                        >
                          {RECURRENCE_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Estimate</Label>
                          <Input
                            value={editData.estimate}
                            onChange={(e) => setEditData({ ...editData, estimate: e.target.value })}
                            placeholder="HH:MM"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400">Spent</Label>
                          <Input
                            value={editData.actualTime}
                            onChange={(e) => setEditData({ ...editData, actualTime: e.target.value })}
                            placeholder="HH:MM"
                            className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="subtasks" className="mt-0 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                      <Plus className="h-4 w-4 text-primary" />
                      <Input
                        placeholder="Add a new subtask..."
                        value={newSubtaskName}
                        onChange={(e) => setNewSubtaskName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAddSubtask()}
                        className="border-none bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
                      />
                      <Button size="sm" onClick={handleQuickAddSubtask} disabled={!newSubtaskName.trim()} className="rounded-full h-7 px-3 text-[10px] font-bold uppercase tracking-wider">
                        Add
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-900 hover:border-primary/20 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                          <Checkbox
                            checked={Boolean(subtask.completed)}
                            onCheckedChange={(c) => handleSubtaskToggle(subtask.id, c === true)}
                            className="h-5 w-5 rounded-full"
                          />
                          <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {subtask.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSubtask(subtask.id)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      {task.subtasks.length === 0 && (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                          <CheckCircle2 className="h-10 w-10 opacity-20" />
                          <p className="text-sm font-medium">Break down your task into smaller steps</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0 h-full">
                    <Textarea
                      placeholder="Start writing notes, ideas, or reminders..."
                      className="min-h-[300px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 leading-relaxed focus:ring-primary/20 text-base"
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    />
                  </TabsContent>

                  <TabsContent value="activity" className="mt-0 space-y-4">
                    <div className="space-y-4">
                      {task.changes.map((change) => (
                        <div key={change.id} className="flex gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-900">
                          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                            <Tag className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{change.fieldChanged}</span>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                {new Date(change.changedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              Changed from <span className="font-mono">{change.oldValue || 'none'}</span> to <span className="font-mono font-bold text-primary">{change.newValue || 'none'}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                      {task.changes.length === 0 && (
                        <p className="text-center py-12 text-slate-400 text-sm">No activity recorded yet</p>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Footer Area */}
            <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full px-4">
                  Delete Task
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={onClose} className="rounded-full px-6">
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving} className="rounded-full px-8 shadow-lg shadow-primary/20">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
   );
};

export default TaskDetails;