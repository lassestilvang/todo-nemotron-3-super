'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import TaskDetails from '@/components/task-details/TaskDetails';
import useDebounce from '@/hooks/use-debounce';
import { apiCache } from '@/lib/cache';
import { TaskSkeleton } from '@/components/task-list/SortableTaskList';
import { toast, Toaster } from 'sonner';
import { Plus, Calendar, Edit, Search, X, Clock, Folder } from 'lucide-react';
import TaskForm from '@/components/task-form/TaskForm';
import ThemeToggle from '@/components/theme/ThemeToggle';
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createId } from '@paralleldrive/cuid2';
import { useApp } from '@/lib/app-context';
import { SortableTaskList } from '@/components/task-list/SortableTaskList';
import type { Task, ViewType } from '@/types/task';

export default function DashboardPage() {
  const {
    activeView,
    setActiveView,
    showCompleted,
    setShowCompleted,
    filterListId,
    setFilterListId,
    filterLabelId,
    setFilterLabelId,
    lists,
    labels,
    addList,
    addLabel,
  } = useApp();

  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskData, setEditTaskData] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [tasksLoading, setTasksLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [operatingOnTaskId, setOperatingOnTaskId] = useState<string | null>(null);

  const handleAddList = async () => {
    const name = prompt('Enter list name:');
    if (name?.trim()) {
      try {
        await addList(name.trim(), 'bg-blue-500', '📋');
      } catch (error) {
        console.error('Failed to add list:', error);
      }
    }
  };

  const handleAddLabel = async () => {
    const name = prompt('Enter label name:');
    if (name?.trim()) {
      try {
        await addLabel(name.trim(), 'bg-purple-500', '🏷️');
      } catch (error) {
        console.error('Failed to add label:', error);
      }
    }
  };

  const closeAllModals = useCallback(() => {
    setIsAddingTask(false);
    setEditTaskId(null);
    setEditTaskData(null);
    setSelectedTaskId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsAddingTask(true);
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        handleAddList();
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === 'K') {
        e.preventDefault();
        handleAddLabel();
      }
      
      if (e.key === 'Escape') {
        closeAllModals();
      }
      
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeAllModals, handleAddList, handleAddLabel]);

  const fetchTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams({
        activeTab: activeView,
        showCompleted: showCompleted.toString(),
        searchQuery: debouncedSearchQuery,
        filterListId: filterListId || '',
        filterLabelId: filterLabelId || '',
      });
      
      // Create cache key based on query parameters
      const cacheKey = `tasks_${params.toString()}`;
      
      // Use cached fetch with retry mechanism and 10-second TTL for task lists
      const tasksWithLabels = await apiCache.createCachedFetch(
        async () => {
          // Retry mechanism with exponential backoff
          const maxRetries = 3;
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              const response = await fetch(`/api/tasks?${params.toString()}`);
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return await response.json();
            } catch (error) {
              if (attempt === maxRetries) {
                throw error; // Re-throw on final attempt
              }
              // Wait before retrying (exponential backoff: 100ms, 200ms, 400ms)
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
            }
          }
        },
        cacheKey,
        10 // 10 seconds TTL
      );
      
      setTasksList(tasksWithLabels);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  }, [activeView, showCompleted, debouncedSearchQuery, filterListId, filterLabelId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (editTaskId) {
      const task = tasksList.find(t => t.id === editTaskId);
      setEditTaskData(task || null);
    }
  }, [editTaskId, tasksList]);

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    const previousTasks = tasksList;
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
  };

  const handleSelectTask = (taskId: string) => {
    if (selectedTaskIds.has(taskId)) {
      setSelectedTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    } else {
      setSelectedTaskIds(prev => new Set(prev).add(taskId));
    }
    // Also set selectedTaskId for details view (single click)
    if (!selectedTaskIds.has(taskId)) {
      setSelectedTaskId(taskId);
    }
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === tasksList.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasksList.map(t => t.id)));
    }
  };

  const handleBulkComplete = async (completed: boolean) => {
    if (selectedTaskIds.size === 0) return;
    
    const previousTasks = tasksList;
    const taskIds = Array.from(selectedTaskIds);
    
    // Optimistic update
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
    } catch (error) {
      // Rollback on error
      setTasksList(previousTasks);
      setSelectedTaskIds(new Set(taskIds));
      console.error('Failed to bulk update tasks:', error);
      toast.error('Failed to update tasks');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    
    if (!window.confirm(`Delete ${selectedTaskIds.size} task${selectedTaskIds.size > 1 ? 's' : ''}?`)) return;
    
    const previousTasks = tasksList;
    const taskIds = Array.from(selectedTaskIds);
    
    // Optimistic update - remove tasks immediately
    setTasksList(prev => prev.filter(task => !taskIds.includes(task.id)));
    setSelectedTaskIds(new Set());

    try {
      for (const taskId of taskIds) {
        await db.delete(tasks).where(eq(tasks.id, taskId));
      }
      toast.success(`${taskIds.length} task${taskIds.length > 1 ? 's' : ''} deleted`);
    } catch (error) {
      // Rollback on error
      setTasksList(previousTasks);
      setSelectedTaskIds(new Set(taskIds));
      console.error('Failed to delete tasks:', error);
      toast.error('Failed to delete tasks');
    }
  };

  return (
    <>
      <Toaster />
      <ErrorBoundary>
        <div className="flex-1 overflow-hidden flex flex-col">
          <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold">Daily Planner</h1>
            <span className="text-sm text-muted-foreground">
              {tasksList.length} task{tasksList.length !== 1 && 's'}
            </span>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <KeyboardShortcutsHelp />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                aria-label="Toggle search"
                className={showSearch ? 'bg-primary/10' : ''}
              >
                <Search className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsAddingTask(true)}
                aria-label="Add new task"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  // TODO: Implement filters modal
                }}
                aria-label="Filter tasks"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </header>
          {showSearch && (
            <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-blue-500" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border-blue-200 dark:border-blue-800 focus:border-blue-500"
                  autoFocus
                />
                <Button variant="ghost" size="icon" onClick={() => { setSearchQuery(''); setShowSearch(false); }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          {selectedTaskIds.size > 0 && (
            <div className="px-6 py-2 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
              <span className="text-sm font-medium text-primary">
                {selectedTaskIds.size} task{selectedTaskIds.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedTaskIds.size === tasksList.length && tasksList.length > 0}
                  onCheckedChange={() => handleSelectAll()}
                  aria-label="Select all"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkComplete(true)}
                >
                  Mark Complete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkComplete(false)}
                >
                  Mark Incomplete
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTaskIds(new Set())}
                >
                  Clear
                </Button>
              </div>
</div>
          )}
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              {tasksList.length === 0 && !tasksLoading && (
                <div className="text-center py-16">
                  <div className="flex h-64 w-64 mx-auto items-center justify-center">
                    <svg className="h-full w-full text-muted-foreground/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                  </div>
                  <p className="mt-6 text-lg text-muted-foreground">Your day is clear</p>
                  <p className="mt-2 text-sm text-muted-foreground/60">
                    Start by adding a new task to get organized!
                  </p>
                  <Button className="mt-4" onClick={() => setIsAddingTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first task
                  </Button>
                </div>
              )}
{tasksList.length > 0 && (
              <SortableTaskList
                tasks={tasksList}
                selectedTaskIds={selectedTaskIds}
                onSelectTask={handleSelectTask}
                onToggleComplete={handleToggleComplete}
                onReorderTasks={async (taskIds) => {
                  for (let i = 0; i < taskIds.length; i++) {
                    const taskId = taskIds[i];
                    if (taskId) {
                      await db.update(tasks).set({ sortOrder: i }).where(eq(tasks.id, taskId));
                    }
                  }
                  await fetchTasks();
                }}
                isLoading={tasksLoading}
                operatingOnTaskId={operatingOnTaskId}
              />
            )}
            </div>
          </main>
          <TaskForm
            isOpen={isAddingTask}
            onOpenChange={(open) => setIsAddingTask(open)}
            submitLabel="Add Task"
            title="Add New Task"
            triggerContent={
              <Button variant="outline" className="w-full">
                <span className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add New Task</span>
                </span>
              </Button>
            }
            onSubmit={async (data) => {
              setIsAddingTask(true);
              try {
                const [taskResult] = await db
                  .insert(tasks)
                  .values({
                    name: data.name,
                    description: data.description,
                    listId: data.listId,
                    date: data.date ? data.date.getTime() : null,
                    deadline: data.deadline ? data.deadline.getTime() : null,
                    priority: data.priority,
                    recurrence: data.recurrence,
                  } as any)
                  .returning();

                // Save labels if any were selected
                if (data.labelIds && data.labelIds.length > 0) {
                  await db.insert(taskLabels).values(
                    data.labelIds.map(labelId => ({
                      id: createId(),
                      taskId: taskResult.id,
                      labelId: labelId,
                    }))
                  );
                }

                setTasksList(prev => [
                  {
                    id: taskResult.id,
                    name: taskResult.name,
                    description: taskResult.description,
                    date: taskResult.date == null ? null : taskResult.date instanceof Date ? taskResult.date : new Date(taskResult.date),
                    deadline: taskResult.deadline == null ? null : taskResult.deadline instanceof Date ? taskResult.deadline : new Date(taskResult.deadline),
                    priority: taskResult.priority,
                    completed: !!taskResult.completed,
                    recurrence: taskResult.recurrence,
                    estimate: taskResult.estimate,
                    actualTime: taskResult.actualTime,
                    reminders: taskResult.reminders,
                    createdAt: taskResult.createdAt instanceof Date ? taskResult.createdAt : new Date(taskResult.createdAt),
                    updatedAt: taskResult.updatedAt instanceof Date ? taskResult.updatedAt : new Date(taskResult.updatedAt),
                    sortOrder: taskResult.sortOrder ?? 0,
                    listId: taskResult.listId,
                    list: lists.find((l) => l.id === data.listId) || {
                      id: '',
                      name: 'No List',
                      color: 'bg-gray-500',
                      emoji: '🔲',
                    },
                    labels: data.labelIds.map(labelId => {
                      const label = labels.find(l => l.id === labelId);
                      return label || {
                        id: labelId,
                        name: 'Unknown',
                        color: 'bg-gray-500',
                        emoji: '❓',
                      };
                    }),
                  },
                  ...prev,
                ]);

                toast.success('Task added successfully');
              } catch (error) {
                console.error('Failed to add task:', error);
                toast.error('Failed to add task');
              } finally {
                setIsAddingTask(false);
              }
            }}
          />

          {/* Task Details Dialog */}
          <TaskDetails 
            taskId={selectedTaskId || ''} 
            onClose={() => setSelectedTaskId(null)}
            onTaskUpdate={(updatedTask) => {
              // Update the task in the list
              setTasksList(prev => 
                prev.map(task => 
                  task.id === updatedTask.id 
                    ? { 
                        ...updatedTask, 
                        list: updatedTask.list || {
                          id: '',
                          name: 'No List',
                          color: 'bg-gray-500',
                          emoji: '🔲',
                        },
                        labels: updatedTask.labels || []
                      }
                    : task
                )
              );
            }}
          />

          {/* Edit Task Form */}
          <TaskForm
            isOpen={!!editTaskId}
            onOpenChange={(open) => { if (!open) { setEditTaskId(null); setEditTaskData(null); } }}
            initialData={editTaskData ? {
              name: editTaskData.name,
              description: editTaskData.description || '',
              listId: editTaskData.listId,
              date: editTaskData.date,
              deadline: editTaskData.deadline,
              priority: editTaskData.priority || 'none',
              recurrence: editTaskData.recurrence || 'none',
              labelIds: editTaskData.labels?.map(l => l.id) || [],
            } : undefined}
            title="Edit Task"
            submitLabel="Save Changes"
            triggerContent={
              <Button variant="outline" className="w-full">
                <span className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit Task</span>
                </span>
              </Button>
            }
            onSubmit={async (data) => {
              if (!editTaskId) return;
              
              try {
                await db
                  .update(tasks)
                  .set({
                    name: data.name,
                    description: data.description,
                    listId: data.listId,
                    date: data.date ? data.date.getTime() : null,
                    deadline: data.deadline ? data.deadline.getTime() : null,
                    priority: data.priority,
                    recurrence: data.recurrence,
                    updatedAt: Date.now(),
                  } as any)
                  .where(eq(tasks.id, editTaskId));

                await db.delete(taskLabels).where(eq(taskLabels.taskId, editTaskId));
                if (data.labelIds && data.labelIds.length > 0) {
                  await db.insert(taskLabels).values(
                    data.labelIds.map(labelId => ({
                      id: createId(),
                      taskId: editTaskId,
                      labelId: labelId,
                    }))
                  );
                }

                await fetchTasks();
                setEditTaskId(null);
                setEditTaskData(null);

                toast.success('Task updated successfully');
              } catch (error) {
                console.error('Failed to update task:', error);
                toast.error('Failed to update task');
              }
            }}
          />
        </div>
      </ErrorBoundary>
    </>
  );
}
