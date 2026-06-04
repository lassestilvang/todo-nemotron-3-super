'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/app/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import TaskDetails from '@/components/task-details/TaskDetails';
import useDebounce from '@/hooks/use-debounce';
import { Skeleton } from '@/components/ui/skeleton';
import { List } from 'react-window';
import { apiCache } from '@/lib/cache';
import { toast, Toaster } from 'sonner';
import { 
   Plus, 
   Calendar, 
   Edit, 
   Clock, 
   Folder 
 } from 'lucide-react';
import TaskForm from '@/components/task-form/TaskForm';
import ThemeToggle from '@/components/theme/ThemeToggle';
import { createId } from '@paralleldrive/cuid2';

type Task = typeof tasks.$inferSelect & {
  list: Pick<typeof lists.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>;
  labels: (Pick<typeof labels.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>)[];
};

type ViewType = 'today' | 'next7' | 'upcoming' | 'all';

interface TaskRowProps {
  index: number;
  style: React.CSSProperties;
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onSelectTask: (taskId: string) => void;
}

function TaskRow({ index, style, tasks, onToggleComplete, onSelectTask }: TaskRowProps) {
  const task = tasks[index];
  if (!task) return null;

  return (
    <div
      style={style}
      key={task.id}
      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
      onClick={() => onSelectTask(task.id)}
    >
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <Checkbox
            checked={Boolean(task.completed)}
            onCheckedChange={(checkedState) => onToggleComplete(task.id, checkedState === true)}
            className="flex-shrink-0"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className={`flex-1 font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.name}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                {/* Priority badge */}
                {task.priority && task.priority !== 'none' && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}
                {/* Overdue badge */}
                {task.deadline && new Date(task.deadline) < new Date(Date.now()) && !task.completed && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Overdue
                  </span>
                )}
              </div>
            </div>
            
            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{task.date ? new Date(task.date).toLocaleDateString() : 'No date'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                <span>{task.list.name}</span>
              </div>
              {task.labels.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {task.labels.map((label) => (
                    <span
                      key={label.id}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${label.color} text-${label.color === 'bg-blue-500' ? 'white' : label.color === 'bg-green-500' ? 'white' : label.color === 'bg-purple-500' ? 'white' : 'black'}`}
                    >
                      {label.emoji} {label.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
    const [tasksList, setTasksList] = useState<Task[]>([]);
    const [listsList, setListsList] = useState<typeof lists.$inferSelect[]>([]);
    const [labelsList, setLabelsList] = useState<typeof labels.$inferSelect[]>([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [activeTab, setActiveTab] = useState<ViewType>('today');
    const [filterListId, setFilterListId] = useState<string | null>(null);
    const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [listsLoading, setListsLoading] = useState(false);
    const [labelsLoading, setLabelsLoading] = useState(false);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl+Shift+A: Add new task
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                setIsAddingTask(true);
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                if (isAddingTask) {
                    setIsAddingTask(false);
                }
                if (editTaskId) {
                    setEditTaskId(null);
                }
                if (selectedTaskId) {
                    setSelectedTaskId(null);
                }
            }
            
            // Ctrl+Enter: Save task (when editing or adding)
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                // This would trigger form submission - handled by the form itself
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isAddingTask, editTaskId, selectedTaskId]);

   useEffect(() => {
     fetchInitialData();
   }, []);

   useEffect(() => {
     fetchTasks();
   }, [activeTab, showCompleted, debouncedSearchQuery, filterListId, filterLabelId]);

      const fetchInitialData = async () => {
        setListsLoading(true);
        setLabelsLoading(true);
        const cacheKey = 'initial_data';
        const cached = apiCache.get<{ lists: typeof lists.$inferSelect[]; labels: typeof labels.$inferSelect[] }>(cacheKey);
        if (cached) {
          setListsList(cached.lists);
          setLabelsList(cached.labels);
         setListsLoading(false);
         setLabelsLoading(false);
         return;
       }
       try {
         const [listsResult, labelsResult] = await Promise.all([
           db.select().from(lists),
           db.select().from(labels),
         ]);
         setListsList(listsResult);
         setLabelsList(labelsResult);
         apiCache.set(cacheKey, { lists: listsResult, labels: labelsResult }, 300); // 5 minutes
       } catch (error) {
         console.error('Failed to fetch initial data:', error);
         toast.error('Failed to load lists and labels');
       } finally {
         setListsLoading(false);
         setLabelsLoading(false);
       }
     };
 
        const fetchTasks = async () => {
          setTasksLoading(true);
          try {
            const params = new URLSearchParams({
              activeTab,
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
        };

   const handleToggleComplete = async (taskId: string, completed: boolean) => {
     try {
       await db.update(tasks).set({ completed }).where(eq(tasks.id, taskId));
       await fetchTasks();
     } catch (error) {
       console.error('Failed to toggle task completion:', error);
       toast.error('Failed to update task');
     }
   };

  return (
    <>
       <Toaster />
        <div className="flex-1 overflow-hidden flex flex-col">
         <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
           <h1 className="text-2xl font-bold">Daily Planner</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
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
          <main className="flex-1 overflow-y-auto p-6">
            {/* Add Task Form */}
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
                      listId: taskResult.listId,
                      list: listsList.find((l) => l.id === data.listId) || {
                        id: '',
                        name: 'No List',
                        color: 'bg-gray-500',
                        emoji: '🔲',
                      },
                      labels: data.labelIds.map(labelId => {
                        const label = labelsList.find(l => l.id === labelId);
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
             onOpenChange={(open) => { if (!open) setEditTaskId(null); }}
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

                 // Update labels - delete existing and insert new ones
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

                 toast.success('Task updated successfully');
               } catch (error) {
                 console.error('Failed to update task:', error);
                 toast.error('Failed to update task');
               }
             }}
             />
               {tasksLoading ? (
                 <>
                   {/* Render 3 skeleton loaders for tasks */}
                   <div className="space-y-4">
                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                       <Card className="p-4">
                         <div className="flex items-start gap-4">
                           <div className="flex-shrink-0">
                             <Skeleton className="h-4 w-4 rounded-full" />
                           </div>
                           <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                               <h3 className="flex-1 font-semibold">
                                 <Skeleton className="h-4 w-32" />
                               </h3>
                               <div className="flex items-center gap-2 text-xs">
                                 <Skeleton className="h-2 w-16 rounded" />
                                 <Skeleton className="h-2 w-12 rounded" />
                               </div>
                             </div>
                             <p className="text-sm text-muted-foreground line-clamp-2">
                               <Skeleton className="h-4 w-40" />
                               <Skeleton className="h-4 w-32" />
                             </p>
                             <div className="flex items-center gap-4 text-xs">
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex flex-wrap gap-1">
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </Card>
                     </div>
                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                       <Card className="p-4">
                         <div className="flex items-start gap-4">
                           <div className="flex-shrink-0">
                             <Skeleton className="h-4 w-4 rounded-full" />
                           </div>
                           <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                               <h3 className="flex-1 font-semibold">
                                 <Skeleton className="h-4 w-32" />
                               </h3>
                               <div className="flex items-center gap-2 text-xs">
                                 <Skeleton className="h-2 w-16 rounded" />
                                 <Skeleton className="h-2 w-12 rounded" />
                               </div>
                             </div>
                             <p className="text-sm text-muted-foreground line-clamp-2">
                               <Skeleton className="h-4 w-40" />
                               <Skeleton className="h-4 w-32" />
                             </p>
                             <div className="flex items-center gap-4 text-xs">
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex flex-wrap gap-1">
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </Card>
                     </div>
                     <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer">
                       <Card className="p-4">
                         <div className="flex items-start gap-4">
                           <div className="flex-shrink-0">
                             <Skeleton className="h-4 w-4 rounded-full" />
                           </div>
                           <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                               <h3 className="flex-1 font-semibold">
                                 <Skeleton className="h-4 w-32" />
                               </h3>
                               <div className="flex items-center gap-2 text-xs">
                                 <Skeleton className="h-2 w-16 rounded" />
                                 <Skeleton className="h-2 w-12 rounded" />
                               </div>
                             </div>
                             <p className="text-sm text-muted-foreground line-clamp-2">
                               <Skeleton className="h-4 w-40" />
                               <Skeleton className="h-4 w-32" />
                             </p>
                             <div className="flex items-center gap-4 text-xs">
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex items-center gap-2">
                                 <Skeleton className="h-3 w-3" />
                                 <Skeleton className="h-3 w-16" />
                               </div>
                               <div className="flex flex-wrap gap-1">
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                                 <Skeleton className="h-3 w-12 rounded" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </Card>
                     </div>
                   </div>
                 </>
                  ) : (
                    <div className="space-y-4">
                      {tasksList.length > 0 ? (
                        <List
                          rowCount={tasksList.length}
                          rowHeight={120}
                          defaultHeight={600}
                          style={{ width: '100%' }}
                          overscanCount={10}
                          rowComponent={TaskRow as any}
                          rowProps={{
                            tasks: tasksList,
                            onToggleComplete: handleToggleComplete,
                            onSelectTask: setSelectedTaskId,
                          }}
                        />
                      ) : (
                       <div className="text-center py-16">
                         <div className="flex h-64 w-64 mx-auto items-center justify-center">
                           <svg className="h-full w-full text-muted-foreground/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                           </svg>
                         </div>
                         <p className="mt-6 text-lg text-muted-foreground">No tasks found</p>
                         <p className="mt-2 text-sm text-muted-foreground/60">
                           Add a new task to get started!
                         </p>
                       </div>
                     )}
                  </div>
                )}
          </main>
      </div>
    </>
  );
}
