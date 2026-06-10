'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import TaskDetails from '@/components/task-details/TaskDetails';
import useDebounce from '@/hooks/use-debounce';
import { useTaskOperations } from '@/hooks/task-operations';
import { TaskSkeleton } from '@/components/task-list/SortableTaskList';
import { toast, Toaster } from 'sonner';
import { Plus, Calendar, Edit, Search, X, Clock, Folder, BarChart2, PieChart, Zap, Target, Download, Upload } from 'lucide-react';
import TaskForm from '@/components/task-form/TaskForm';
import ThemeToggle from '@/components/theme/ThemeToggle';
import KeyboardShortcutsHelp from '@/components/keyboard-shortcuts';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { createId } from '@paralleldrive/cuid2';
import { useApp } from '@/lib/app-context';
import { SortableTaskList, EmptyTaskList, TaskListLoading, TaskStats } from '@/components/task-list/SortableTaskList';
import type { Task, ViewType } from '@/types/task';
import { setupExportImportHandlers } from '@/lib/export-import';

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
  const [quickAddText, setQuickAddText] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const activeListId = filterListId || lists[0]?.id;
  
  const exportHandlers = setupExportImportHandlers(tasksList, lists, labels);

  const handleAddList = async () => {
    const name = prompt('Enter list name:');
    if (name?.trim()) {
      try {
        await addList(name.trim(), 'bg-blue-500', '📋');
      } catch (error) {
        console.error('Failed to add list:', error);
        toast.error('Failed to add list');
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
        toast.error('Failed to add label');
      }
    }
  };

  const closeAllModals = useCallback(() => {
    setIsAddingTask(false);
    setEditTaskId(null);
    setEditTaskData(null);
    setSelectedTaskId(null);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
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
    
    if (e.ctrlKey && e.shiftKey && e.key === 'E') {
      e.preventDefault();
      exportHandlers.handleExport();
    }
    
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (ev) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (!file) return;
        try {
          await exportHandlers.handleImport(file);
        } catch (error) {
          // Error already handled in export-import.ts
        }
      };
      input.click();
    }
  }, [closeAllModals, handleAddList, handleAddLabel, exportHandlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const {
    handleToggleComplete,
    handleSelectTask,
    handleSelectAll,
    handleBulkComplete,
    handleBulkDelete,
    handleReorderTasks,
  } = useTaskOperations({
    tasksList,
    setTasksList,
    setSelectedTaskIds,
    setOperatingOnTaskId,
    fetchTasks,
  });

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

  const handleSelectTaskWithDetails = (taskId: string) => {
    handleSelectTask(taskId);
    if (!selectedTaskIds.has(taskId)) {
      setSelectedTaskId(taskId);
    }
  };

  return (
    <>
      <Toaster />
      <ErrorBoundary>
        <div className="flex-1 overflow-hidden flex flex-col">
          <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <h1 className="text-xl sm:text-2xl font-bold">Daily Planner</h1>
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <PieChart className="h-3 w-3" />
                  <span>{tasksList.length} tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="h-3 w-3" />
                  <span>{tasksList.filter(t => t.completed).length} done</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  <span>{tasksList.filter(t => !t.completed && t.priority === 'high').length} high</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  <span>{tasksList.filter(t => t.deadline && new Date(t.deadline).toDateString() === new Date().toDateString()).length} today</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant={focusMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFocusMode(!focusMode)}
                aria-label="Toggle focus mode"
                className="hidden sm:flex"
              >
                <Target className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Focus Mode</span>
              </Button>
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
                onClick={() => exportHandlers.handleExport()}
                aria-label="Export tasks"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (!file) return;
                    try {
                      await exportHandlers.handleImport(file);
                    } catch (error) {
                      // Error already handled in export-import.ts
                    }
                  };
                  input.click();
                }}
                aria-label="Import tasks"
              >
                <Upload className="h-4 w-4" />
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
            {tasksLoading ? (
              <TaskListLoading />
            ) : tasksList.length === 0 ? (
              <>
                <TaskStats tasks={tasksList} />
                <EmptyTaskList onAddTask={() => setIsAddingTask(true)} />
              </>
            ) : (
              <>
                <TaskStats tasks={tasksList} />
                <SortableTaskList
                  tasks={tasksList}
                  selectedTaskIds={selectedTaskIds}
                  onSelectTask={handleSelectTaskWithDetails}
                  onToggleComplete={handleToggleComplete}
                  onReorderTasks={handleReorderTasks}
                  isLoading={tasksLoading}
                  operatingOnTaskId={operatingOnTaskId}
                />
              </>
            )}
          </div>
        </main>
        
        <footer className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <Input
              placeholder="Quick add task... (Ctrl+Shift+A)"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter' && quickAddText.trim()) {
                  e.preventDefault();
                  try {
                    const trimmedName = quickAddText.trim();
                    const existingCount = tasksList.filter(
                      t => t.name.toLowerCase() === trimmedName.toLowerCase()
                    ).length;
                    
                    if (existingCount > 0) {
                      const proceed = window.confirm(
                        `Task "${trimmedName}" already exists ${existingCount > 0 ? `${existingCount} time(s)` : ''}. Add anyway?`
                      );
                      if (!proceed) return;
                    }
                    
                    const res = await fetch('/api/tasks', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: trimmedName,
                        listId: activeListId || lists[0]?.id || '',
                      }),
                    });
                    
                    if (res.ok) {
                      await fetchTasks();
                      setQuickAddText('');
                      toast.success('Task added');
                    } else {
                      throw new Error('Failed to add task');
                    }
                  } catch (error) {
                    console.error('Failed to add task:', error);
                    toast.error('Failed to add task');
                  }
                }
              }}
              className="flex-1"
            />
          </div>
        </footer>
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
                const res = await fetch('/api/tasks', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description,
                    listId: data.listId,
                    date: data.date ? data.date.toISOString() : null,
                    deadline: data.deadline ? data.deadline.toISOString() : null,
                    priority: data.priority,
                    recurrence: data.recurrence,
                    labelIds: data.labelIds || [],
                  }),
                });

                if (!res.ok) throw new Error('Failed to add task');

                await fetchTasks();
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
                const res = await fetch(`/api/tasks/${editTaskId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: data.name,
                    description: data.description,
                    listId: data.listId,
                    date: data.date ? data.date.toISOString() : null,
                    deadline: data.deadline ? data.deadline.toISOString() : null,
                    priority: data.priority,
                    recurrence: data.recurrence,
                    labelIds: data.labelIds || [],
                  }),
                });

                if (!res.ok) throw new Error('Failed to update task');

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
