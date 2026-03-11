import { useState, useEffect } from 'react';
import { db } from '@/lib/db/index';
import { tasks, lists, labels, taskLabels } from '@/lib/db/schema';
import { eq, and, isNotNull, isNull, desc, sql } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Sonner, toast } from 'sonner';
import { Calendar, Plus, Trash2, Edit, Repeat, Clock, Reminder, Flag, Folder, Paperclip } from 'lucide-react';
import TaskDetails from '@/components/task-details/TaskDetails';
import { useDebounce } from '@/hooks/use-debounce';
import { MotionWrapper, fadeIn, staggerContainer } from '@/components/animations/motion-wrapper';

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
  list: typeof lists.$inferSelect;
  labels: (typeof labels.$inferSelect)[];
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
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    listId: '',
    date: null as Date | null,
    deadline: null as Date | null,
    priority: 'none' as const,
    recurrence: 'none' as const,
  });
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [editTaskData, setEditTaskData] = useState({
    name: '',
    description: '',
    listId: '',
    date: null as Date | null,
    deadline: null as Date | null,
    priority: 'none' as const,
    recurrence: 'none' as const,
  });
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
      let query = db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          date: tasks.date,
          deadline: tasks.deadline,
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
        .orderBy(desc(tasks.createdAt));

      // Apply filters based on active tab
      const now = Date.now();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      
      const next7DaysEnd = new Date(now);
      next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);
      next7DaysEnd.setHours(23, 59, 59, 999);

      switch (activeTab) {
        case 'today':
          query = query.where(
            and(
              isNotNull(tasks.date),
              sql`${tasks.date} >= ${todayStart} AND ${tasks.date} <= ${todayEnd}`
            )
          );
          break;
        case 'next7':
          query = query.where(
            and(
              isNotNull(tasks.date),
              sql`${tasks.date} >= ${todayStart} AND ${tasks.date} <= ${next7DaysEnd}`
            )
          );
          break;
        case 'upcoming':
          query = query.where(
            and(
              isNotNull(tasks.date),
              sql`${tasks.date} >= ${todayStart}`
            )
          );
          break;
        case 'all':
          // No date filter for 'all' view
          break;
      }

      // Apply completed tasks filter
      if (!showCompleted) {
        query = query.where(eq(tasks.completed, false));
      }

      // Apply search filter
      if (debouncedSearchQuery.trim()) {
        query = query.where(
          sql`${tasks.name} ILIKE '%' || ${debouncedSearchQuery} || '%' OR ${tasks.description} ILIKE '%' || ${debouncedSearchQuery} || '%'`
        );
      }

      // Apply list filter
      if (filterListId) {
        query = query.where(eq(tasks.listId, filterListId));
      }

      // Apply label filter
      if (filterLabelId) {
        query = query
          .innerJoin(taskLabels, eq(tasks.id, taskLabels.taskId))
          .where(eq(taskLabels.labelId, filterLabelId));
      }

      const results = await query;

      // Fetch labels for each task
      const tasksWithLabels = await Promise.all(
        results.map(async (task) => {
          const taskLabelsResult = await db
            .select({
              id: labels.id,
              name: labels.name,
              color: labels.color,
              emoji: labels.emoji,
            })
            .from(taskLabels)
            .innerJoin(labels, eq(taskLabels.labelId, labels.id))
            .where(eq(taskLabels.taskId, task.id));

          return {
            ...task,
            list: task.list || {
              id: '',
              name: 'No List',
              color: 'bg-gray-500',
              emoji: '🔲',
            },
            labels: taskLabelsResult,
          };
        })
      );

      setTasksList(tasksWithLabels);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      toast.error('Failed to load tasks');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.name.trim() || !newTask.listId) {
      toast.error('Please enter a task name and select a list');
      return;
    }

    setIsAddingTask(true);
    try {
      const [result] = await db
        .insert(tasks)
        .values({
          name: newTask.name,
          description: newTask.description,
          listId: newTask.listId,
          date: newTask.date ? newTask.date.getTime() : null,
          deadline: newTask.deadline ? newTask.deadline.getTime() : null,
          priority: newTask.priority,
          recurrence: newTask.recurrence,
        })
        .returning();

      setTasksList(prev => [
        {
          ...result,
          list: listsList.find((l) => l.id === newTask.listId) || {
            id: '',
            name: 'No List',
            color: 'bg-gray-500',
            emoji: '🔲',
          },
          labels: [],
        },
        ...prev,
      ]);

      setNewTask({
        name: '',
        description: '',
        listId: '',
        date: null,
        deadline: null,
        priority: 'none',
        recurrence: 'none',
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

  const handleStartEdit = (task: Task) => {
    setEditTaskId(task.id);
    setEditTaskData({
      name: task.name,
      description: task.description || '',
      listId: task.list.id,
      date: task.date ? new Date(task.date) : null,
      deadline: task.deadline ? new Date(task.deadline) : null,
      priority: task.priority,
      recurrence: task.recurrence || 'none',
    });
  };

  const handleSaveEdit = async () => {
    if (!editTaskId || !editTaskData.name.trim() || !editTaskData.listId) {
      toast.error('Please enter a task name and select a list');
      return;
    }

    try {
      await db
        .update(tasks)
        .set({
          name: editTaskData.name,
          description: editTaskData.description,
          listId: editTaskData.listId,
          date: editTaskData.date ? editTaskData.date.getTime() : null,
          deadline: editTaskData.deadline ? editTaskData.deadline.getTime() : null,
          priority: editTaskData.priority,
          recurrence: editTaskData.recurrence,
          updatedAt: Date.now(),
        })
        .where(eq(tasks.id, editTaskId));

      await fetchTasks();
      setEditTaskId(null);

      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleCancelEdit = () => {
    setEditTaskId(null);
  };

  return (
    <>
      <Sonner />
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
          {isAddingTask && (
            <div className="mb-6">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Add New Task</span>
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <DialogContent>
                    <form className="space-y-4" onSubmit={(e) => {
                      e.preventDefault();
                      handleAddTask();
                    }}>
                      <div>
                        <Label htmlFor="task-name">Task Name</Label>
                        <Input
                          id="task-name"
                          value={newTask.name}
                          onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                          placeholder="Enter task name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-description">Description</Label>
                        <Textarea
                          id="task-description"
                          value={newTask.description}
                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                          placeholder="Enter task description (optional)"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-list">List</Label>
                          <select
                            id="task-list"
                            value={newTask.listId}
                            onChange={(e) => setNewTask({ ...newTask, listId: e.target.value })}
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
                              </option)
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="task-priority">Priority</Label>
                          <select
                            id="task-priority"
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as const })}
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
                          <Label htmlFor="task-date">Date</Label>
                          <input
                            id="task-date"
                            type="date"
                            value={newTask.date ? newTask.date.toISOString().split('T')[0] : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setNewTask({ ...newTask, date });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="task-deadline">Deadline</Label>
                          <input
                            id="task-deadline"
                            type="datetime-local"
                            value={newTask.deadline ? newTask.deadline.toISOString().slice(0, 16) : ''}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : null;
                              setNewTask({ ...newTask, deadline: date });
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="task-recurrence">Recurrence</Label>
                          <select
                            id="task-recurrence"
                            value={newTask.recurrence}
                            onChange={(e) => setNewTask({ ...newTask, recurrence: e.target.value as const })}
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
                          <Label htmlFor="task-label">Label</Label>
                          <select
                            id="task-label"
                            multiple
                            onChange={(e) => {
                              // Handle multiple select - for now we'll just store the first selected value
                              // In a full implementation, we'd need to handle the task_labels relationship
                              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                              // For simplicity, we're not storing labels in the task directly
                              // but rather in the task_labels table - this would require a more complex implementation
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
                              </option)
                            ))}
                          </select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="ghost"
                          onClick={() => setIsAddingTask(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddTask}
                          isLoading={isAddingTask}
                        >
                          Add Task
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </Dialog>
            </div>
          )}

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
                  <DialogContent>
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
                              </option)
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="edit-task-priority">Priority</Label>
                          <select
                            id="edit-task-priority"
                            value={editTaskData.priority}
                            onChange={(e) => setEditTaskData({ ...editTaskData, priority: e.target.value as const })}
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
                            value={editTaskData.recurrence}
                            onChange={(e) => setEditTaskData({ ...editTaskData, recurrence: e.target.value as const })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          >
                            {RECURRENCE_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option)
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="edit-task-label">Label</Label>
                          <select
                            id="edit-task-label"
                            multiple
                            onChange={(e) => {
                              // Handle multiple select - for now we'll just store the first selected value
                              // In a full implementation, we'd need to handle the task_labels relationship
                              const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                              // For simplicity, we're not storing labels in the task directly
                              // but rather in the task_labels table - this would require a more complex implementation
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
                              </option)
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

          {/* Tabs */}
          <MotionWrapper 
            initial={false} 
            animate={true}
            className="mb-6 flex gap-2"
          >
            <Button
              variant={activeTab === 'today' ? 'outline' : 'default'}
              onClick={() => setActiveTab('today')}
            >
              Today
            </Button>
            <Button
              variant={activeTab === 'next7' ? 'outline' : 'default'}
              onClick={() => setActiveTab('next7')}
            >
              Next 7 Days
            </Button>
            <Button
              variant={activeTab === 'upcoming' ? 'outline' : 'default'}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={activeTab === 'all' ? 'outline' : 'default'}
              onClick={() => setActiveTab('all')}
            >
              All
            </Button>
          </MotionWrapper>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 sm:w-auto">
              <Label htmlFor="search-input">Search tasks</Label>
              <Input
                id="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
              />
            </div>
            <div className="flex-1 sm:w-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <Label htmlFor="show-completed">Show completed</Label>
                <Checkbox
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
              </div>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Implement filter modal
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
              </div>
            }
          </div>

          {/* Tasks List */}
          <MotionWrapper 
            variants={staggerContainer()}
            initial={false} 
            animate={true}
            className="space-y-4"
          >
            {tasksList.length === 0 ? (
              <MotionWrapper 
                variants={fadeIn('up', 0.2)}
                initial={false} 
                animate={true}
                className="text-center py-12"
              >
                <p className="text-muted-foreground">No tasks found</p>
                {activeTab === 'today' && (
                  <Button variant="outline" onClick={() => setIsAddingTask(true)}>
                    Add your first task
                  </Button>
                )}
              </MotionWrapper>
            ) : (
              <div className="space-y-4">
                {tasksList.map((task, index) => (
                  <MotionWrapper 
                    key={task.id}
                    variants={fadeIn('up', index * 0.05)}
                    initial={false} 
                    animate={true}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-pointer"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <Card className="p-4">
                      <div className="flex items-start gap-4">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={(checked) => handleToggleComplete(task.id, checked)}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`flex-1 font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.name}
                            </h3>
                            <div className="flex items-center gap-2 text-xs">
                              {/* Priority badge */}
                              {task.priority !== 'none' && (
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
                              {task.deadline && new Date(task.deadline) < Date.now() && !task.completed && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  Overdue
                                </span>
                              )}
                              {/* Recurrence badge */}
                              {task.recurrence && task.recurrence !== 'none' && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                  {task.recurrence.charAt(0).toUpperCase() + task.recurrence.slice(1)}
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
                      <CardFooter className="flex justify-end pt-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(task);
                          }}
                          aria-label="Edit task"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  </MotionWrapper>
                ))}
              </div>
            )}
          </MotionWrapper>
        </main>
      </div>
    </>
  );
}

// TODO: Replace with actual icon from lucide-react
const Filter = () => <span>🔍</span>;
