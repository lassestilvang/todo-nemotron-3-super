'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  CheckSquare,
  Square,
  AlertCircle,
  Copy,
  Share2,
  Plus,
  Calendar,
  Clock,
  Folder,
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  Award,
  Flame,
  Sparkles,
  LayoutDashboard,
  Bell,
  Link,
  Paperclip,
  Timer,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatTimeHHMM } from '@/lib/utils';
import type { Task } from '@/types/task';
import { motion, AnimatePresence } from 'framer-motion';

function getLabelColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    'bg-red-500': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    'bg-blue-500': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'bg-green-500': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'bg-purple-500': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'bg-yellow-500': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'bg-pink-500': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    'bg-indigo-500': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    'bg-teal-500': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    'bg-cyan-500': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    'bg-orange-500': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'bg-lime-500': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200',
    'bg-emerald-500': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    'bg-violet-500': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    'bg-fuchsia-500': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200',
    'bg-slate-500': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    'bg-gray-500': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
}

export function TaskStats({ tasks: taskList }: { tasks: Task[] }) {
  const total = taskList.length;
  const completed = taskList.filter(t => t.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const highPriority = taskList.filter(t => t.priority === 'high' && !t.completed).length;
  const dueToday = taskList.filter(t => {
    if (!t.deadline) return false;
    const today = new Date();
    const deadline = new Date(t.deadline);
    return deadline.toDateString() === today.toDateString();
  }).length;
  const overdue = taskList.filter(t => !t.completed && t.deadline && new Date(t.deadline) < new Date()).length;
  const withSubtasks = taskList.filter(t => t.subtasks && t.subtasks.length > 0).length;
  
  const totalEstimate = taskList.reduce((sum, t) => sum + (typeof t.estimate === 'number' ? t.estimate : 0), 0);
  const totalActual = taskList.reduce((sum, t) => sum + (t.actualTime || 0), 0);
  const timeEfficiency = totalEstimate > 0 ? Math.round((totalActual / totalEstimate) * 100) : 0;

  return (
    <div className="task-stats grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
      <div className="bg-card rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">Completion</span>
        </div>
        <p className="text-2xl font-bold mt-1">{completionRate}%</p>
        <p className="text-xs text-muted-foreground">{completed}/{total} tasks</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-red-500" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
        <p className="text-2xl font-bold mt-1">{highPriority}</p>
        <p className="text-xs text-muted-foreground">priority</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="text-xs text-muted-foreground">Due Today</span>
        </div>
        <p className="text-2xl font-bold mt-1">{dueToday}</p>
        <p className="text-xs text-muted-foreground">tasks</p>
      </div>
      <div className="bg-card rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <span className="text-xs text-muted-foreground">Overdue</span>
        </div>
        <p className="text-2xl font-bold mt-1 text-red-500">{overdue}</p>
        <p className="text-xs text-muted-foreground">tasks</p>
      </div>
      <div className="bg-card rounded-lg p-3 border hidden sm:block">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-purple-500" />
          <span className="text-xs text-muted-foreground">Subtasks</span>
        </div>
        <p className="text-2xl font-bold mt-1">{withSubtasks}</p>
        <p className="text-xs text-muted-foreground">with tasks</p>
      </div>
      <div className="bg-card rounded-lg p-3 border hidden md:block">
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">Time Eff.</span>
        </div>
        <p className="text-2xl font-bold mt-1">{timeEfficiency}%</p>
        <p className="text-xs text-muted-foreground">efficiency</p>
      </div>
    </div>
  );
}

const EMPTY_STATE_MESSAGES: Record<string, { title: string; desc: string }> = {
  today: { title: 'Your day is clear', desc: 'Enjoy your free time, or add a task to get started!' },
  next7: { title: 'Nothing due this week', desc: 'Plan ahead by scheduling some tasks for the coming days.' },
  upcoming: { title: 'No upcoming tasks', desc: 'Set a future date on a task to see it here.' },
  all: { title: 'No tasks yet', desc: 'Start by adding a new task to get organized!' },
};

export function EmptyTaskList({ onAddTask, activeView }: { onAddTask: () => void; activeView?: string }) {
  const msg = (EMPTY_STATE_MESSAGES[activeView || 'all'] || EMPTY_STATE_MESSAGES.all) as { title: string; desc: string };
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 rounded-full animate-pulse" />
        <div className="absolute inset-4 bg-primary/10 dark:bg-primary/20 rounded-full animate-pulse delay-75" />
        <div className="relative flex items-center justify-center h-full">
          {activeView === 'today' ? (
            <Sparkles className="h-20 w-20 text-primary opacity-50" />
          ) : activeView === 'all' ? (
            <LayoutDashboard className="h-20 w-20 text-primary opacity-50" />
          ) : (
            <Calendar className="h-20 w-20 text-primary opacity-50" />
          )}
        </div>
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 mb-2">
        {msg.title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed">
        {msg.desc}
      </p>
      <Button 
        onClick={onAddTask}
        className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create your first task
      </Button>
    </div>
  );
}

export function TaskListLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}

interface SortableTaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onSelectTask: (taskId: string) => void;
  onReorderTasks: (taskIds: string[]) => void;
  selectedTaskIds: Set<string>;
  isLoading?: boolean;
  operatingOnTaskId?: string | null;
  searchQuery?: string;
}

export function SortableTaskList({
  tasks,
  onToggleComplete,
  onSelectTask,
  onReorderTasks,
  selectedTaskIds,
  isLoading = false,
  operatingOnTaskId,
  searchQuery = '',
}: SortableTaskListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dragOverlayRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (tasks.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, tasks.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(tasks.length - 1);
        break;
      case 'Enter':
      case ' ':
        if (focusedIndex >= 0 && focusedIndex < tasks.length) {
          e.preventDefault();
          const task = tasks[focusedIndex];
          if (task) {
            onSelectTask(task.id);
          }
        }
        break;
      case 'c':
        if (e.ctrlKey && focusedIndex >= 0 && focusedIndex < tasks.length) {
          e.preventDefault();
          const task = tasks[focusedIndex];
          if (task) {
            onToggleComplete(task.id, !task.completed);
          }
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  }, [tasks, onSelectTask, focusedIndex, onToggleComplete]);

  // Auto-scroll to focused item
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.querySelector(`[data-task-index="${focusedIndex}"]`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = arrayMove(tasks, oldIndex, newIndex);
        const newTaskIds = newTasks.map((task) => task.id);
        onReorderTasks(newTaskIds);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={listRef}
          className="space-y-4"
          role="list"
          aria-label="Tasks"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <AnimatePresence initial={false}>
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.2, 
                  delay: index * 0.05,
                  layout: { type: 'spring', stiffness: 300, damping: 30 } 
                }}
              >
                <SortableTaskItem
                  task={task}
                  index={index}
                  tasksLength={tasks.length}
                  onToggleComplete={onToggleComplete}
                  onSelectTask={onSelectTask}
                  onDuplicateTask={() => {}}
                  onShareTask={(t) => {
                    navigator.share?.({
                      title: t.name,
                      text: t.description || undefined,
                      url: window.location.href,
                    }).catch(() => {
                      navigator.clipboard.writeText(`${window.location.href}#task-${t.id}`);
                    });
                  }}
                  isSelected={selectedTaskIds.has(task.id)}
                  isDragging={activeId === task.id}
                  isFocused={focusedIndex === index}
                  isOperatingOnTask={task.id === operatingOnTaskId}
                  searchQuery={searchQuery}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SearchHighlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary dark:text-primary rounded-sm px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface SortableTaskItemProps {
  task: Task;
  index: number;
  tasksLength: number;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onSelectTask: (taskId: string) => void;
  onDuplicateTask: (task: Task) => void;
  onShareTask: (task: Task) => void;
  isSelected: boolean;
  isDragging: boolean;
  isFocused: boolean;
  isOperatingOnTask: boolean;
  searchQuery?: string;
}

function SortableTaskItem({
  task,
  index,
  tasksLength,
  onToggleComplete,
  onSelectTask,
  onDuplicateTask,
  onShareTask,
  isSelected,
  isDragging,
  isFocused,
  isOperatingOnTask,
  searchQuery = '',
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-primary/20 bg-white dark:bg-slate-900 ${isSelected ? 'ring-2 ring-primary/50 bg-primary/5 shadow-md' : ''} ${isDragging ? 'shadow-2xl ring-2 ring-primary scale-[1.02] z-50' : ''} ${isFocused ? 'ring-2 ring-secondary/50' : ''} ${task.completed ? 'opacity-80' : ''}`}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={tasksLength}
      aria-selected={isSelected}
      aria-grabbed={isDragging}
      data-task-index={index}
      onClick={() => onSelectTask(task.id)}
    >
      <div className="p-4 flex items-start gap-4">
        <div 
          {...attributes} 
          {...listeners}
          className="mt-1 text-slate-300 dark:text-slate-700 hover:text-slate-900 dark:hover:text-slate-100 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
        
        <div className="flex flex-col items-center gap-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={Boolean(task.completed)}
            onCheckedChange={(checked) => onToggleComplete(task.id, checked === true)}
            className={`h-5 w-5 rounded-full transition-all ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 dark:border-slate-700'}`}
            disabled={isOperatingOnTask}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className={`font-semibold truncate transition-all ${task.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100'}`}>
              <SearchHighlight text={task.name} query={searchQuery} />
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.priority && task.priority !== 'none' && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  task.priority === 'high' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                  task.priority === 'medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                  'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {task.priority}
                </span>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
            <div className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${task.list.color}`} />
              <span>{task.list.name}</span>
            </div>

            {task.deadline && (
              <div className={`flex items-center gap-1 ${new Date(task.deadline) < new Date() && !task.completed ? 'text-red-500 font-medium' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}

            {totalSubtasks > 0 && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                <CheckSquare className="h-3 w-3" />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
            )}

            {task.estimate && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTimeHHMM(task.estimate)}</span>
              </div>
            )}

            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={(e) => { e.stopPropagation(); onDuplicateTask(task); }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                onClick={(e) => { e.stopPropagation(); onShareTask(task); }}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TaskSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden animate-pulse">
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-5 w-5 rounded bg-muted/50" />
          <Skeleton className="h-5 w-5 rounded bg-muted/50" />
          <Skeleton className="h-5 w-5 rounded bg-muted/50" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32 bg-muted/50" />
              <Skeleton className="h-2 w-16 rounded bg-muted/30" />
              <Skeleton className="h-2 w-12 rounded bg-muted/30" />
            </div>
            <Skeleton className="h-4 w-40 bg-muted/50" />
            <Skeleton className="h-4 w-32 bg-muted/50" />
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 bg-muted/50" />
                <Skeleton className="h-3 w-16 bg-muted/30" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 bg-muted/50" />
                <Skeleton className="h-3 w-16 bg-muted/30" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 bg-muted/50" />
                <Skeleton className="h-3 w-16 bg-muted/30" />
              </div>
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-3 w-12 rounded bg-muted/50" />
                <Skeleton className="h-3 w-12 rounded bg-muted/30" />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function TaskListLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </div>
  );
}
