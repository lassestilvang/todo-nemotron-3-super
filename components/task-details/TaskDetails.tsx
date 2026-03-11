import { useState } from 'react';
import { db } from '@/lib/db/index';
import { tasks, lists, labels, taskLabels, subtasks, attachments, taskChanges } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogPrimitive as DialogRoot } from '@/components/ui/dialog';
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuPrimitive as DropdownMenuRoot } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSonner } from 'sonner';
import { 
  Calendar, 
  Clock, 
  Reminder, 
  Timer, 
  Tag, 
  Flag, 
  Repeat, 
  Paperclip, 
  Trash2, 
  Edit,
  ChevronDown,
  CheckCircle,
  X,
  Upload,
  List,
  Plus,
  PenTool,
  Minus,
  History,
  Clock as HistoryClock
} from 'lucide-react';

type TaskWithDetails = typeof tasks.$inferSelect & {
  list: typeof lists.$inferSelect;
  labels: (typeof labels.$inferSelect)[];
  subtasks: typeof subtasks.$inferSelect[];
  attachments: typeof attachments.$inferSelect[];
  changes: typeof taskChanges.$inferSelect[];
};

export default function TaskDetails({ 
  taskId, 
  onClose, 
  onTaskUpdate 
}: { 
  taskId: string; 
  onClose: () => void; 
  onTaskUpdate: (task: TaskWithDetails) => void; 
}) {
  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    date: null as Date | null,
    deadline: null as Date | null,
    estimate: '',
    actualTime: '',
    priority: 'none' as const,
  });
  const [subtaskEditing, setSubtaskEditing] = useState<string | null>(null);
  const [subtaskName, setSubtaskName] = useState('');
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'history'>('details');

  const loadTask = async () => {
    try {
      setLoading(true);
      
      // Fetch task with list
      const taskResult = await db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          date: tasks.date,
          deadline: tasks.deadline,
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

      if (taskResult.length === 0) {
        toast.error('Task not found');
        onClose();
        return;
      }

      const taskData = taskResult[0];

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
        ...taskData,
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

      // Set edit data
      setEditData({
        name: taskData.name,
        description: taskData.description || '',
        date: taskData.date ? new Date(taskData.date) : null,
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        estimate: taskData.estimate ? Math.floor(taskData.estimate / 60).toString().padStart(2, '0') + ':' + (taskData.estimate % 60).toString().padStart(2, '0') : '00:00',
        actualTime: taskData.actualTime ? Math.floor(taskData.actualTime / 60).toString().padStart(2, '0') + ':' + (taskData.actualTime % 60).toString().padStart(2, '0') : '00:00',
        priority: taskData.priority,
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to load task details:', error);
      toast.error('Failed to load task details');
      setLoading(false);
    }
  };

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const handleUpdate = async () => {
    if (!editData.name.trim()) {
      toast.error('Please enter a task name');
      return;
    }

    try {
      const estimateMinutes = parseTime(editData.estimate);
      const actualTimeMinutes = parseTime(editData.actualTime);

      const updates: Partial<typeof tasks.$inferSelect> = {
        name: editData.name,
        description: editData.description,
        date: editData.date ? editData.date.getTime() : null,
        deadline: editData.deadline ? editData.deadline.getTime() : null,
        estimate: estimateMinutes,
        actualTime: actualTimeMinutes,
        priority: editData.priority,
        updatedAt: Date.now(),
      };

      await db.update(tasks).set(updates).where(eq(tasks.id, taskId));
      
      // Log changes (simplified - in a real app you'd compare each field)
      await db.insert(taskChanges).values({
        taskId,
        fieldChanged: 'multiple',
        oldValue: '{}',
        newValue: JSON.stringify(updates),
        changedAt: Date.now(),
      });

      const updatedTask = await db
        .select({
          id: tasks.id,
          name: tasks.name,
          description: tasks.description,
          date: tasks.date,
          deadline: tasks.deadline,
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

      // Fetch labels, subtasks, attachments again for the updated task
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

      // Fetch updated changes
      const changesResult = await db
        .select()
        .from(taskChanges)
        .where(eq(taskChanges.taskId, taskId))
        .orderBy(desc(taskChanges.changedAt))
        .limit(50);

      const updatedTaskWithDetails = {
        ...updatedTask[0],
        list: updatedTask[0].list || {
          id: '',
          name: 'No List',
          color: 'bg-gray-500',
          emoji: '🔲',
        },
        labels: labelsResult,
        subtasks: subtasksResult,
        attachments: attachmentsResult,
        changes: changesResult,
      };

      setTask(updatedTaskWithDetails);
      setEditing(false);
      onTaskUpdate(updatedTaskWithDetails);
      
      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    
    try {
      await db.update(tasks).set({ completed: !task.completed }).where(eq(tasks.id, taskId));
      
      // Log change
      await db.insert(taskChanges).values({
        taskId,
        fieldChanged: 'completed',
        oldValue: task.completed.toString(),
        newValue: (!task.completed).toString(),
        changedAt: Date.now(),
      });

      const updatedTask = { ...task, completed: !task.completed };
      setTask(updatedTask);
      onTaskUpdate(updatedTask);
      
      toast.success(`Task marked as ${!task.completed ? 'completed' : 'incomplete'}`);
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await db.delete(tasks).where(eq(tasks.id, taskId));
        toast.success('Task deleted successfully');
        onClose();
      } catch (error) {
        console.error('Failed to delete task:', error);
        toast.error('Failed to delete task');
      }
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskName.trim()) {
      toast.error('Please enter a subtask name');
      return;
    }

    try {
      const [result] = await db
        .insert(subtasks)
        .values({
          taskId,
          name: newSubtaskName,
          completed: false,
        })
        .returning();

      // Log change
      await db.insert(taskChanges).values({
        taskId,
        fieldChanged: 'subtask_added',
        oldValue: '',
        newValue: newSubtaskName,
        changedAt: Date.now(),
      });

      setNewSubtaskName('');
      
      // Refresh task data
      loadTask();
      
      toast.success('Subtask added successfully');
    } catch (error) {
      console.error('Failed to add subtask:', error);
      toast.error('Failed to add subtask');
    }
  };

  const handleUpdateSubtask = async (subtaskId: string, name: string) => {
    if (!name.trim()) {
      toast.error('Please enter a subtask name');
      return;
    }

    try {
      await db
        .update(subtasks)
        .set({ name })
        .where(eq(subtasks.id, subtaskId));

      // Log change
      await db.insert(taskChanges).values({
        taskId,
        fieldChanged: `subtask_${name}`,
        oldValue: '',
        newValue: name,
        changedAt: Date.now(),
      });

      setSubtaskEditing(null);
      
      // Refresh task data
      loadTask();
      
      toast.success('Subtask updated successfully');
    } catch (error) {
      console.error('Failed to update subtask:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      try {
        await db.delete(subtasks).where(eq(subtasks.id, subtaskId));
        
        // Log change
        await db.insert(taskChanges).values({
          taskId,
          fieldChanged: 'subtask_deleted',
          oldValue: '',
          newValue: '',
          changedAt: Date.now(),
        });

        // Refresh task data
        loadTask();
        
        toast.success('Subtask deleted successfully');
      } catch (error) {
        console.error('Failed to delete subtask:', error);
        toast.error('Failed to delete subtask');
      }
    }
  };

  const handleToggleSubtaskComplete = async (subtaskId: string, completed: boolean) => {
    try {
      await db.update(subtasks).set({ completed }).where(eq(subtasks.id, subtaskId));
      
      // Log change
      await db.insert(taskChanges).values({
        taskId,
        fieldChanged: `subtask_${completed ? 'completed' : 'incompleted'}`,
        oldValue: (!completed).toString(),
        newValue: completed.toString(),
        changedAt: Date.now(),
      });

      // Refresh task data
      loadTask();
    } catch (error) {
      console.error('Failed to toggle subtask completion:', error);
      toast.error('Failed to update subtask');
    }
  };

  const handleStartEditSubtask = (subtaskId: string, name: string) => {
    setSubtaskEditing(subtaskId);
    setSubtaskName(name);
  };

  const handleCancelEditSubtask = () => {
    setSubtaskEditing(null);
    setSubtaskName('');
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  if (loading || !task) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div></div> // Placeholder, will be replaced by caller
        </DialogTrigger>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <DialogTitle>Loading task details...</DialogTitle>
        </DialogHeader>
        <DialogContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 border-2 border-primary rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        </DialogContent>
      </DialogContent>
       );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div></div> // Placeholder, will be replaced by caller
      </DialogTrigger>
      <DialogContent className="w-full max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{task.name}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDelete}
                aria-label="Delete task"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
                disabled={editing}
                aria-label="Edit task"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <DialogContent className="space-y-4">
          {/* Tabs */}
          <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex flex-1 items-center justify-center px-2 py-2 text-sm font-medium rounded-muted hover:bg-muted">
                Details
              </TabsTrigger>
              <TabsTrigger value="subtasks" className="flex flex-1 items-center justify-center px-2 py-2 text-sm font-medium rounded-muted hover:bg-muted">
                Subtasks
              </TabsTrigger>
              <TabsTrigger value="history" className="flex flex-1 items-center justify-center px-2 py-2 text-sm font-medium rounded-muted hover:bg-muted">
                History
              </TabsTrigger>
            </TabsList>
            
            {/* Details Tab Content */}
            <TabsContent value="details" className="space-y-6 pt-4">
              {/* Task completion checkbox */}
              <div className="flex items-center">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  className="flex-shrink-0"
                />
                <h2 className={`flex-1 text-xl font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {task.name}
                </h2>
              </div>
              
              {/* Description */}
              {task.description && (
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{task.description}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Dates and timing */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {task.date ? new Date(task.date).toLocaleDateString(undefined, { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) : 'No date set'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Deadline */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Deadline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm ${task.deadline && new Date(task.deadline) < Date.now() && !task.completed ? 'text-destructive' : ''}`}>
                        {task.deadline ? new Date(task.deadline).toLocaleString(undefined, { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }) : 'No deadline'}
                      </span>
                      {task.deadline && new Date(task.deadline) < Date.now() && !task.completed && (
                        <span className="ml-1 h-2 w-2 bg-destructive rounded-full"></span>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Estimate */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Estimate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{editData.estimate}</span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Actual Time */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Actual Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{editData.actualTime}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Priority and Recurrence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Flag className={`h-4 w-4 ${task.priority === 'high' ? 'text-destructive' : task.priority === 'medium' ? 'text-warning' : task.priority === 'low' ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm text-capitalize">
                        {task.priority === 'none' ? 'None' : task.priority}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Recurrence */}
                <Card className="border">
                  <CardHeader>
                    <CardTitle>Recurrence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Repeat className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {task.recurrence ? task.recurrence.charAt(0).toUpperCase() + task.recurrence.slice(1) : 'None'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Labels */}
              <div className="border">
                <CardHeader>
                  <CardTitle>Labels</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {task.labels.length > 0 ? (
                    task.labels.map((label) => (
                      <span
                        key={label.id}
                        className={`px-3 py-1 rounded text-xs font-medium ${label.color} text-${label.color === 'bg-blue-500' ? 'white' : label.color === 'bg-green-500' ? 'white' : label.color === 'bg-purple-500' ? 'white' : 'black'}`}
                      >
                        {label.emoji} {label.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No labels</span>
                  )}
                </CardContent>
              </div>
            </TabsContent>
            
            {/* Subtasks Tab Content */}
            <TabsContent value="subtasks" className="space-y-6 pt-4">
              {/* Subtasks */}
              <div className="border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Subtasks</CardTitle>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setNewSubtaskName('');
                        // Focus the input after opening
                        setTimeout(() => {
                          const input = document.getElementById('new-subtask-input');
                          if (input) input.focus();
                        }, 100);
                      }}
                      aria-label="Add subtask"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.subtasks.length > 0 ? (
                    <>
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.id} className="border rounded p-3 flex items-center gap-3">
                          {subtaskEditing === subtask.id ? (
                            <>
                              <input
                                type="text"
                                value={subtaskName}
                                onChange={(e) => setSubtaskName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateSubtask(subtask.id, subtaskName);
                                  }
                                }}
                                onBlur={() => {
                                  if (subtaskName.trim()) {
                                    handleUpdateSubtask(subtask.id, subtaskName);
                                  } else {
                                    handleCancelEditSubtask();
                                  }
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={handleCancelEditSubtask}
                                  size="icon"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  onClick={() => handleUpdateSubtask(subtask.id, subtaskName)}
                                  size="icon"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <Checkbox
                                checked={subtask.completed}
                                onCheckedChange={(checked) => handleToggleSubtaskComplete(subtask.id, checked)}
                                className="flex-shrink-0"
                              />
                              <span className={`flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''} cursor-pointer`}
                                onClick={() => handleStartEditSubtask(subtask.id, subtask.name)}
                              >
                                {subtask.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSubtask(subtask.id)}
                                aria-label="Delete subtask"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      ))}
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2">
                          <input
                            id="new-subtask-input"
                            type="text"
                            value={newSubtaskName}
                            placeholder="Add a subtask..."
                            onChange={(e) => setNewSubtaskName(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleAddSubtask();
                              }
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                          />
                          <Button
                            onClick={handleAddSubtask}
                            size="icon"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No subtasks yet</p>
                      <div className="mt-4">
                        <input
                          type="text"
                          value={newSubtaskName}
                          placeholder="Add your first subtask..."
                          onChange={(e) => setNewSubtaskName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddSubtask();
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </div>
            </TabsContent>
            
            {/* History Tab Content */}
            <TabsContent value="history" className="pt-4">
              <div className="border">
                <CardHeader>
                  <CardTitle>Change History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {task.changes.length > 0 ? (
                    task.changes.map((change) => (
                      <div key={change.id} className="border-t pt-3 first:border-t-0">
                        <div className="flex items-start gap-3">
                          <HistoryClock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {change.fieldChanged}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(change.changedAt).toLocaleString()}
                            </p>
                            <div className="text-xs text-muted-foreground break-all">
                              {change.oldValue} → {change.newValue}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No change history available</p>
                    </div>
                  )}
                </CardContent>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
        
        {editing ? (
          <DialogFooter>
            <form className="space-y-4" onSubmit={(e) => {
              e.preventDefault();
              handleUpdate();
            }}>
              <div>
                <Label htmlFor="edit-task-name">Task Name</Label>
                <Input
                  id="edit-task-name"
                  defaultValue={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-task-description">Description</Label>
                <Textarea
                  id="edit-task-description"
                  defaultValue={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-task-date">Date</Label>
                  <input
                    id="edit-task-date"
                    type="date"
                    defaultValue={editData.date ? editData.date.toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setEditData({ ...editData, date });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-task-deadline">Deadline</Label>
                  <input
                    id="edit-task-deadline"
                    type="datetime-local"
                    defaultValue={editData.deadline ? editData.deadline.toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null;
                      setEditData({ ...editData, deadline: date });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-task-estimate">Estimate (HH:mm)</Label>
                  <input
                    id="edit-task-estimate"
                    type="text"
                    defaultValue={editData.estimate}
                    onChange={(e) => {
                      // Validate time format HH:mm
                      const value = e.target.value;
                      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
                        setEditData({ ...editData, estimate: value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:mm"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-task-actual-time">Actual Time (HH:mm)</Label>
                  <input
                    id="edit-task-actual-time"
                    type="text"
                    defaultValue={editData.actualTime}
                    onChange={(e) => {
                      // Validate time format HH:mm
                      const value = e.target.value;
                      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value) || value === '') {
                        setEditData({ ...editData, actualTime: value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="HH:mm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="edit-task-priority">Priority</Label>
                <select
                  id="edit-task-priority"
                  defaultValue={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value as const })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  isLoading={editing}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogFooter>
        ) : (
          <DialogFooter className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
            >
              Edit Task
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete Task
            </Button>
            <Button
              onClick={onClose}
            >
              Close
            </Button>
          </DialogFooter>
        )}
      </Dialog>
    </Dialog>
  );
}
