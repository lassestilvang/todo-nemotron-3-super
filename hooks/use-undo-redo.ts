"use client"

import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface UndoAction {
  type: 'create' | 'update' | 'delete';
  taskData: any;
  previousData?: any;
  timestamp: number;
}

export function useUndoRedo() {
  const historyRef = useRef<UndoAction[]>([]);
  const futureRef = useRef<UndoAction[]>([]);
  const MAX_HISTORY = 50;

  const addAction = useCallback((action: UndoAction) => {
    historyRef.current = [...historyRef.current.slice(-MAX_HISTORY + 1), action];
    futureRef.current = []; // Clear future when new action is added
  }, []);

  const undo = useCallback(async () => {
    const lastAction = historyRef.current.pop();
    if (!lastAction) {
      toast.info('Nothing to undo');
      return null;
    }

    futureRef.current.push(lastAction);

    try {
      switch (lastAction.type) {
        case 'create':
          // Undo create = delete
          await fetch(`/api/tasks/${lastAction.taskData.id}`, {
            method: 'DELETE',
          });
          toast.success('Task creation undone');
          return { type: 'create', taskId: lastAction.taskData.id };

        case 'update':
          // Undo update = restore previous data
          if (lastAction.previousData) {
            await fetch(`/api/tasks/${lastAction.taskData.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lastAction.previousData),
            });
            toast.success('Task update undone');
            return { type: 'update', taskId: lastAction.taskData.id };
          }
          break;

        case 'delete':
          // Undo delete = recreate
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lastAction.taskData),
          });
          if (!res.ok) throw new Error('Failed to restore task');
          toast.success('Task deletion undone');
          return { type: 'delete', taskId: lastAction.taskData.id };
      }
    } catch (error) {
      console.error('Failed to undo:', error);
      toast.error('Failed to undo action');
      // Revert history if undo failed
      historyRef.current.push(lastAction);
      futureRef.current.pop();
      return null;
    }
  }, []);

  const redo = useCallback(async () => {
    const nextAction = futureRef.current.pop();
    if (!nextAction) {
      toast.info('Nothing to redo');
      return null;
    }

    historyRef.current.push(nextAction);

    try {
      switch (nextAction.type) {
        case 'create':
          // Redo create = recreate
          const createRes = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextAction.taskData),
          });
          if (!createRes.ok) throw new Error('Failed to recreate task');
          toast.success('Task creation redone');
          return { type: 'create', taskId: nextAction.taskData.id };

        case 'update':
          // Redo update = apply the update again
          const updateRes = await fetch(`/api/tasks/${nextAction.taskData.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextAction.taskData),
          });
          if (!updateRes.ok) throw new Error('Failed to reapply update');
          toast.success('Task update redone');
          return { type: 'update', taskId: nextAction.taskData.id };

        case 'delete':
          // Redo delete = delete again
          await fetch(`/api/tasks/${nextAction.taskData.id}`, {
            method: 'DELETE',
          });
          toast.success('Task deletion redone');
          return { type: 'delete', taskId: nextAction.taskData.id };
      }
    } catch (error) {
      console.error('Failed to redo:', error);
      toast.error('Failed to redo action');
      // Revert future if redo failed
      futureRef.current.push(nextAction);
      historyRef.current.pop();
      return null;
    }
  }, []);

  const canUndo = historyRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    futureRef.current = [];
  }, []);

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: historyRef.current.length,
    futureLength: futureRef.current.length,
  };
}
