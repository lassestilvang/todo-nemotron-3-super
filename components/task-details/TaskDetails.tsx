'use client';

import { useState, useEffect, memo } from 'react';
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
  Clock,
  Calendar,
  Play,
  Pause,
  X,
} from 'lucide-react';
import { formatTimeHHMM, parseHHMMtoMinutes } from '@/lib/utils';
import type { Task } from '@/types/task';
import confetti from 'canvas-confetti';

interface TaskDetailsProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export function TaskDetails({ taskId, onClose, onTaskUpdate }: TaskDetailsProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    date: null as Date | null,
    deadline: null as Date | null,
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

  useEffect(() => {
    const loadTask = async () => {
      if (!taskId) return;

      setIsLoading(true);
      try {
        const res = await fetch(`/api/tasks/${taskId}`);
        if (!res.ok) {
          throw new Error('Failed to load task');
        }
        const taskData = await res.json();

        setTask({
          ...taskData,
          date: taskData.date ? new Date(taskData.date) : null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          createdAt: new Date(taskData.createdAt),
          updatedAt: new Date(taskData.updatedAt),
        });

        setEditData({
          name: taskData.name || '',
          description: taskData.description || '',
          date: taskData.date ? new Date(taskData.date) : null,
          deadline: taskData.deadline ? new Date(taskData.deadline) : null,
          priority: taskData.priority || 'none',
          recurrence: taskData.recurrence || 'none',
          estimate: taskData.estimate ? formatTimeHHMM(taskData.estimate) : '00:00',
          actualTime: taskData.actualTime ? formatTimeHHMM(taskData.actualTime) : '00:00',
        });
      } catch (error) {
        console.error('Failed to load task:', error);
        toast.error('Failed to load task');
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

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
        estimate: parseHHMMtoMinutes(editData.estimate),
        actualTime: parseHHMMtoMinutes(editData.actualTime),
      };

      data.date = editData.date ? editData.date.toISOString() : null;
      data.deadline = editData.deadline ? editData.deadline.toISOString() : null;

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to save task');

      const updatedTask = await res.json();

      // Update local task state
      setTask(prev => prev ? {
        ...prev,
        ...updatedTask,
        date: updatedTask.date ? new Date(updatedTask.date) : null,
        deadline: updatedTask.deadline ? new Date(updatedTask.deadline) : null,
        createdAt: new Date(updatedTask.createdAt),
        updatedAt: new Date(updatedTask.updatedAt),
      } : null);

      // Notify parent component
      if (onTaskUpdate) {
        onTaskUpdate({
          ...updatedTask,
          date: updatedTask.date ? new Date(updatedTask.date) : null,
          deadline: updatedTask.deadline ? new Date(updatedTask.deadline) : null,
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: new Date(updatedTask.updatedAt),
        });
      }

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
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete task');

      toast.success('Task deleted successfully');
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim() || !task) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubtaskName.trim() }),
      });

      if (!res.ok) throw new Error('Failed to add subtask');

      const newSubtask = await res.json();
      setTask(prev => prev ? {
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask],
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

  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });

      if (!res.ok) throw new Error('Failed to toggle subtask');

      if (onTaskUpdate && task) {
        const updatedSubtasks = (task.subtasks || []).map(s =>
          s.id === subtaskId ? { ...s, completed } : s
        );
        onTaskUpdate({ ...task, subtasks: updatedSubtasks });
      }

      setTask(prev => prev ? {
        ...prev,
        subtasks: (prev.subtasks || []).map(s =>
          s.id === subtaskId ? { ...s, completed } : s
        ),
      } : null);

      toast.success(`Subtask marked as ${completed ? 'complete' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle subtask:', error);
      toast.error('Failed to toggle subtask');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (!window.confirm('Delete this subtask?')) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subtask');

      setTask(prev => prev ? {
        ...prev,
        subtasks: (prev.subtasks || []).filter(s => s.id !== subtaskId),
      } : null);
      toast.success('Subtask deleted');
    } catch (error) {
      console.error('Failed to delete subtask:', error);
      toast.error('Failed to delete subtask');
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
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualTime: newActualTime }),
      });

      if (!res.ok) throw new Error('Failed to update time');

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

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });

      if (!res.ok) throw new Error('Failed to toggle task completion');

      const updatedTask = await res.json();

      // Update local state
      setTask(prev => prev ? {
        ...prev,
        ...updatedTask,
        date: updatedTask.date ? new Date(updatedTask.date) : null,
        deadline: updatedTask.deadline ? new Date(updatedTask.deadline) : null,
        createdAt: new Date(updatedTask.createdAt),
        updatedAt: new Date(updatedTask.updatedAt),
      } : null);

      // Notify parent
      if (onTaskUpdate) {
        onTaskUpdate({
          ...updatedTask,
          date: updatedTask.date ? new Date(updatedTask.date) : null,
          deadline: updatedTask.deadline ? new Date(updatedTask.deadline) : null,
          createdAt: new Date(updatedTask.createdAt),
          updatedAt: new Date(updatedTask.updatedAt),
        });
      }

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
        <DialogContent className="max-w-3xl p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
          <div className="flex flex-col h-[85vh]">
            <div className="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
              <DialogHeader>
                <DialogTitle>Loading task...</DialogTitle>
              </DialogHeader>
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Task Name</div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Priority</div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Schedule Date</div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Deadline</div>
                    <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
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
            <DialogTitle>Task not found</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center py-4 text-muted-foreground">The task you're looking for doesn't exist or has been deleted.</p>
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
                    : new Date(task.deadline).toDateString() === new Date().toDateString()
                      ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800'
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
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="details" className="flex flex-col h-full">
              <div className="px-8 border-b border-slate-100 dark:border-slate-900">
                <TabsList className="bg-transparent h-12 gap-6 p-0">
                  <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                    Details
                  </TabsTrigger>
                  <TabsTrigger value="subtasks" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                    Subtasks ({task.subtasks?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 text-sm font-semibold h-full transition-none">
                    Notes
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
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                      className="border-none bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto text-sm"
                    />
                    <Button size="sm" onClick={handleAddSubtask} disabled={!newSubtaskName.trim() || isSaving} className="rounded-full h-7 px-3 text-[10px] font-bold uppercase tracking-wider">
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(task.subtasks || []).map((subtask) => (
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
                          disabled={isSaving}
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(task.subtasks || []).length === 0 && (
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
              </div>
            </Tabs>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isSaving} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full px-4">
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
}

export default memo(TaskDetails);