"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/app/lib/db/index';
import { tasks, taskLabels } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { toast } from 'sonner';
import type { Task } from '@/types/task';

interface UseTaskOperationsProps {
  tasksList: Task[];
  setTasksList: React.Dispatch<React.SetStateAction<Task[]>>;
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setOperatingOnTaskId: React.Dispatch<React.SetStateAction<string | null>>;
  fetchTasks: () => Promise<void>;
}

export function useTaskOperations({
  tasksList,
  setTasksList,
  setSelectedTaskIds,
  setOperatingOnTaskId,
  fetchTasks,
}: UseTaskOperationsProps) {
  const previousTasksRef = useRef<Task[]>([]);

  const handleToggleComplete = useCallback(async (taskId: string, completed: boolean) => {
    const previousTasks = [...tasksList];
    setOperatingOnTaskId(taskId);
    
    setTasksList(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      )
    );

    try {
      await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));
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
    if (selectedTaskIds.has(taskId)) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } else {
      setSelectedTaskIds(prev => new Set(prev).add(taskId));
    }
  }, [selectedTaskIds, setSelectedTaskIds]);

  const handleSelectAll = useCallback(() => {
    if (selectedTaskIds.size === tasksList.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasksList.map(t => t.id)));
    }
  }, [selectedTaskIds, setSelectedTaskIds, tasksList]);

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
      for (const taskId of taskIds) {
        await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));
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
    
    if (!window.confirm(`Delete ${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''}?`)) return;
    
    const previousTasks = [...tasksList];
    const taskIds = Array.from(selectedTaskIds);
    
    setTasksList(prev => prev.filter(task => !taskIds.includes(task.id)));
    setSelectedTaskIds(new Set());

    try {
      for (const taskId of taskIds) {
        await db.delete(tasks).where(eq(tasks.id, taskId));
      }
      toast.success(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} deleted`);
    } catch (error) {
      setTasksList(previousTasks);
      setSelectedTaskIds(new Set(taskIds));
      console.error('Failed to delete tasks:', error);
      toast.error('Failed to delete tasks');
    }
  }, [selectedTaskIds, tasksList, setTasksList, setSelectedTaskIds]);

  const handleReorderTasks = useCallback(async (taskIds: string[]) => {
    for (let i = 0; i < taskIds.length; i++) {
      const taskId = taskIds[i];
      if (taskId) {
        await db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, taskId));
      }
    }
    await fetchTasks();
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