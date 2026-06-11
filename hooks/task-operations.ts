"use client"

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Task } from '@/types/task';
import confetti from 'canvas-confetti';

interface UseTaskOperationsProps {
  tasksList: Task[];
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>;
  selectedTaskIds: Set<string>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setOperatingOnTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchTasks: () => Promise<void>;
}

export function useTaskOperations({
  tasksList,
  setTasksList,
  selectedTaskIds,
  setSelectedTaskIds,
  setOperatingOnTaskId,
  fetchTasks,
}: UseTaskOperationsProps) {

  const handleToggleComplete = useCallback(async (taskId: string, completed: boolean) => {
    const previousTasks = [...tasksList];
    setOperatingOnTaskId(taskId);

    if (completed) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 999,
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      });
    }

    setTasksList(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, completed } : task
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
      if (!res.ok) throw new Error('Failed to toggle task');
      toast.success(`Task marked as ${completed ? 'complete' : 'incomplete'}`);
    } catch (error) {
      setTasksList(previousTasks);
      console.error('Failed to toggle task completion:', error);
      toast.error('Failed to update task');
    } finally {
      setOperatingOnTaskId(null);
    }
  }, [tasksList, setTasksList, setOperatingOnTaskId]);

  const handleSelectTask = useCallback((taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, [setSelectedTaskIds]);

  const handleSelectAll = useCallback(() => {
    setSelectedTaskIds(prev => {
      if (prev.size === tasksList.length) {
        return new Set();
      }
      return new Set(tasksList.map(t => t.id));
    });
  }, [tasksList, setSelectedTaskIds]);

  const handleBulkComplete = useCallback(async (completed: boolean) => {
    if (selectedTaskIds.size === 0) return;

    const previousTasks = [...tasksList];
    const taskIds = Array.from(selectedTaskIds);

    setTasksList(prev =>
      prev.map(task =>
        taskIds.includes(task.id) ? { ...task, completed } : task
      )
    );
    setSelectedTaskIds(new Set());

    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: completed ? 'complete' : 'incomplete',
          taskIds,
        }),
      });
      if (!res.ok) throw new Error('Failed to bulk update');

      if (completed) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          zIndex: 999,
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        });
      }

      toast.success(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} marked as ${completed ? 'complete' : 'incomplete'}`);
      await fetchTasks();
    } catch (error) {
      setTasksList(previousTasks);
      setSelectedTaskIds(new Set(taskIds));
      console.error('Failed to bulk update tasks:', error);
      toast.error('Failed to update tasks');
    }
  }, [selectedTaskIds, tasksList, setTasksList, setSelectedTaskIds, fetchTasks]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    const taskIds = Array.from(selectedTaskIds);
    const deletedTasks = tasksList.filter(t => taskIds.includes(t.id));

    setTasksList(prev => prev.filter(task => !taskIds.includes(task.id)));
    setSelectedTaskIds(new Set());

    try {
      const res = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', taskIds }),
      });
      if (!res.ok) throw new Error('Failed to bulk delete');

      toast(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} deleted`, {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              for (const task of deletedTasks) {
                await fetch('/api/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: task.name,
                    description: task.description,
                    listId: task.listId,
                    priority: task.priority,
                    recurrence: task.recurrence || 'none',
                  }),
                });
              }
              await fetchTasks();
              toast.success('Delete undone');
            } catch {
              toast.error('Failed to undo delete');
            }
          },
        },
      });
    } catch (error) {
      setTasksList(prev => [...deletedTasks, ...prev]);
      setSelectedTaskIds(new Set(taskIds));
      console.error('Failed to delete tasks:', error);
      toast.error('Failed to delete tasks');
    }
  }, [selectedTaskIds, tasksList, setTasksList, setSelectedTaskIds, fetchTasks]);

  const handleReorderTasks = useCallback(async (taskIds: string[]) => {
    try {
      const res = await fetch('/api/tasks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskIds }),
      });
      if (!res.ok) throw new Error('Failed to reorder');
      await fetchTasks();
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
      toast.error('Failed to reorder tasks');
    }
  }, [fetchTasks]);

  return {
    handleToggleComplete,
    handleSelectTask,
    handleSelectAll,
    handleBulkComplete,
    handleBulkDelete,
    handleReorderTasks,
  };
}
