'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/app/lib/db/schema';
import { eq, desc, and, isNotNull, sql } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
   Dialog, 
   DialogContent, 
   DialogFooter, 
   DialogHeader, 
   DialogTitle, 
   DialogTrigger, 
   DialogRoot 
} from '@/components/ui/dialog';
import { 
   DropdownMenuContent, 
   DropdownMenuItem, 
   DropdownMenuTrigger as DropdownMenu, 
   DropdownMenuRoot 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import TaskDetails from '@/components/task-details/TaskDetails';
import useDebounce from '@/hooks/use-debounce';
import { MotionWrapper, fadeIn, staggerContainer } from '@/components/animations/motion-wrapper';
import { toast, Toaster } from 'sonner';
import { 
   Plus, 
   Calendar, 
   Edit, 
   Filter, 
   Clock, 
   Folder, 
   Trash2, 
   ChevronDown,
   CheckCircle,
   X,
   Upload,
   List,
   PenTool,
   Minus,
   History,
   Repeat,
   Flag,
   Timer
} from 'lucide-react';
import TaskForm from '@/components/task-form/TaskForm';
import { createId } from '@paralleldrive/cuid2';

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekday', label: 'Weekdays' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

type Task = typeof tasks.$inferSelect & {
  list: Pick<typeof lists.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>;
  labels: (Pick<typeof labels.$inferSelect, 'id' | 'name' | 'color' | 'emoji'>)[];
};

type ViewType = 'today' | 'next7' | 'upcoming' | 'all';

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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [activeTab, showCompleted, debouncedSearchQuery, filterListId, filterLabelId]);

  const fetchInitialData = async () => {
    try {
      const [listsResult, labelsResult] = await Promise.all([
        db.select().from(lists),
        db.select().from(labels),
      ]);
      setListsList(listsResult);
      setLabelsList(labelsResult);
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      toast.error('Failed to load lists and labels');
    }
  };

     const fetchTasks = async () => {
       try {
         const params = new URLSearchParams({
           activeTab,
           showCompleted: showCompleted.toString(),
           searchQuery: debouncedSearchQuery,
           filterListId: filterListId || '',
           filterLabelId: filterLabelId || '',
         });

         const response = await fetch(`/api/tasks?${params.toString()}`);
         if (!response.ok) {
           throw new Error('Failed to fetch tasks');
         }
         
         const tasksWithLabels = await response.json();
         setTasksList(tasksWithLabels);
       } catch (error) {
         console.error('Failed to fetch tasks:', error);
         toast.error('Failed to load tasks');
       }
     };

    const handleStartEdit = async (task: Task) => {
      setEditTaskId(task.id);
    };

  const handleAddTask = async () => {
    if (!newTask.name.trim() || !newTask.listId) {
      toast.error('Please enter a task name and select a list');
      return;
    }

        setIsAddingTask(true);
       try {
         const [taskResult] = await db
           .insert(tasks)
           .values({
             name: newTask.name,
             description: newTask.description,
             listId: newTask.listId,
             date: newTask.date ? newTask.date.getTime() : null,
             deadline: newTask.deadline ? newTask.deadline.getTime() : null,
             priority: newTask.priority,
             recurrence: newTask.recurrence,
             } as any)
           .returning();

         // Save labels if any were selected
         if (newTask.labelIds && newTask.labelIds.length > 0) {
           await db.insert(taskLabels).values(
             newTask.labelIds.map(labelId => ({
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
             list: listsList.find((l) => l.id === newTask.listId) || {
               id: '',
               name: 'No List',
               color: 'bg-gray-500',
               emoji: '🔲',
             },
             labels: newTask.labelIds.map(labelId => {
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

        setNewTask({
          name: '',
          description: '',
          listId: '',
          date: null as Date | null,
          deadline: null as Date | null,
          priority: 'none' as const,
          recurrence: 'none' as const,
          labelIds: [] as string[],
        });
        setIsAddingTask(false);

        toast.success('Task added successfully');
      } catch (error) {
        console.error('Failed to add task:', error);
        toast.error('Failed to add task');
        setIsAddingTask(false);
      }
   };

  const handleUpdateTask = async (taskId: string, updates: Partial<typeof tasks.$inferSelect>) => {
    try {
      await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
      await fetchTasks();
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await db.delete(tasks).where(eq(tasks.id, taskId));
      setTasksList(tasksList.filter((task) => task.id !== taskId));
      
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
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

          {/* Edit Task Form */}
          {editTaskId && (
             <div className="mb-6">
               <Dialog>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="w-full">
                     <span className="flex items-center gap-2">
                       <Edit className="h-4 w-4" />
                       <span>Edit Task</span>
                     </span>
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="w-full max-w-md">
                   <DialogHeader>
                     <DialogTitle>Edit Task</DialogTitle>
                   </DialogHeader>
                   <form className="space-y-4" onSubmit={(e) => {
                       e.preventDefault();
                       handleSaveEdit();
                     }}>
                      <div>
                        <Label htmlFor="edit-task-name">Task Name</Label>
                        <Input
                          id="edit-task-name"
                          value={editTaskData.name}
                          onChange={(e) => setEditTaskData({ ...editTaskData, name: e.target.value })}
                          placeholder="Enter task name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-task-description">Description</Label>
                        <Textarea
                          id="edit-task-description"
                          value={editTaskData.description}
                          onChange={(e) => setEditTaskData({ ...editTaskData, description: e.target.value })}
                          placeholder="Enter task description (optional)"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-task-list">List</Label>
                          <select
                            id="edit-task-list"
                            value={editTaskData.listId}
                            onChange={(e) => setEditTaskData({ ...editTaskData, listId: e.target.value })}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="">Select a list</option>
                            {listsList.map((list) => (
                              <option key={list.id} value={list.id}>
                                <span className="flex items-center gap-2">
                                  <span className={`${list.color} h-4 w-4 flex items-center justify-center rounded`}>
                                    {list.emoji}
                                  </span>
                                 <span>{list.name}</span>
                               </span>
                             </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="edit-task-priority">Priority</Label>
                          <select
                            id="edit-task-priority"
                            value={editTaskData.priority ?? undefined}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditTaskData({ ...editTaskData, priority: value as typeof editTaskData.priority });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            <option value="none">None</option>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-task-date">Date</Label>
                          <input
                            id="edit-task-date"
                            type="date"
                            value={editTaskData.date ? editTaskData.date.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setEditTaskData({ ...editTaskData, date });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-task-deadline">Deadline</Label>
                          <input
                            id="edit-task-deadline"
                            type="datetime-local"
                            value={editTaskData.deadline ? editTaskData.deadline.toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setEditTaskData({ ...editTaskData, deadline: date });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-task-recurrence">Recurrence</Label>
                           <select
                             id="edit-task-recurrence"
                             value={editTaskData.recurrence ?? undefined}
                             onChange={(e) => setEditTaskData({ ...editTaskData, recurrence: e.target.value })}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                           >
                             {RECURRENCE_OPTIONS.map((option) => (
                               <option key={option.value} value={option.value}>
                                 {option.label}
                               </option>
                             ))}
                          </select>
                        </div>
                      <div>
                           <Label htmlFor="edit-task-label">Label</Label>
                           <select
                             id="edit-task-label"
                             multiple
                             value={editTaskData.labelIds}
                             onChange={(e) => {
                               setEditTaskData({ ...editTaskData, labelIds: Array.from(e.target.selectedOptions).map(opt => opt.value) });
                             }}
                             className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                           >
                             <option value="">Select labels</option>
                             {labelsList.map((label) => (
                               <option key={label.id} value={label.id}>
                                 <span className="flex items-center gap-2">
                                   <span className={`${label.color} h-4 w-4 flex items-center justify-center rounded`}>
                                     {label.emoji}
                                   </span>
                                   <span>{label.name}</span>
                                 </span>
                               </option>
                             ))}
                           </select>
                         </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveEdit}
                        >
                          Save Changes
                        </Button>
                       </DialogFooter>
                     </form>
                   </DialogContent>
                 </Dialog>
               </div>
          )}

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
              </MotionWrapper>
            ) : (
              <div className="space-y-4">
                {tasksList.map((task, index) => (
                   <div 
                     key={task.id}
                     className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
                     onClick={() => setSelectedTaskId(task.id)}
                   >
                     <Card className="p-4">
                       <div className="flex items-start gap-4">
                           <Checkbox
                             checked={Boolean(task.completed)}
                             onCheckedChange={(checkedState) => handleToggleComplete(task.id, checkedState === true)}
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
                ))}
              </div>
            )}
          </MotionWrapper>
        </main>
      </div>
    </>
  );
}

// Filter icon is imported from lucide-react above
