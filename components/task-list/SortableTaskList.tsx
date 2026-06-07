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
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/types/task';

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

export function EmptyTaskList() {
  return (
    <div className="text-center py-16">
      <div className="flex h-64 w-64 mx-auto items-center justify-center">
        <svg className="h-full w-full text-muted-foreground/30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V7h2v2zm4 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
        </svg>
      </div>
      <p className="mt-4 text-lg text-muted-foreground">No tasks yet</p>
      <p className="mt-2 text-sm text-muted-foreground/60">
        Start by adding a new task!
      </p>
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
}

export function SortableTaskList({
  tasks,
  onToggleComplete,
  onSelectTask,
  onReorderTasks,
  selectedTaskIds,
  isLoading = false,
  operatingOnTaskId,
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
      case 'Delete':
        if (focusedIndex >= 0 && focusedIndex < tasks.length) {
          // Could add delete handler here
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
          {tasks.map((task, index) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              index={index}
              tasksLength={tasks.length}
              onToggleComplete={onToggleComplete}
              onSelectTask={onSelectTask}
              onDuplicateTask={(t) => {
                const duplicated = { ...t, id: crypto.randomUUID(), name: `${t.name} (copy)` };
                onReorderTasks([...tasks.map((x) => x.id), duplicated.id]);
              }}
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
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
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

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLButtonElement || e.target instanceof HTMLInputElement) {
      return;
    }
    if (listeners?.onMouseDown) {
      listeners.onMouseDown(e);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''} ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}
      onMouseDown={handleDragStart}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={tasksLength}
      aria-selected={isSelected}
      aria-grabbed={isDragging}
    >
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <button
            {...attributes}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground p-1 rounded transition-colors"
            aria-label="Drag to reorder"
            tabIndex={-1}
          >
            <GripVertical className="h-5 w-5" />
          </button>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelectTask(task.id)}
            className="flex-shrink-0"
            aria-label="Select task"
          />
          <Checkbox
            checked={Boolean(task.completed)}
            onCheckedChange={(checkedState) => onToggleComplete(task.id, checkedState === true)}
            className="flex-shrink-0"
            aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            disabled={isOperatingOnTask}
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className={`flex-1 font-semibold ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                {task.name}
              </h3>
              <div className="flex items-center gap-2 text-xs">
                {task.completed && (
                  <CheckSquare className="h-4 w-4 text-green-500" />
                )}
                {!task.completed && task.deadline && new Date(task.deadline) < new Date(Date.now()) && (
                  <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                )}
                {task.priority && task.priority !== 'none' && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium priority-${task.priority}`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {task.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <span
                    key={label.id}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${getLabelColorClass(label.color)}`}
                  >
                    {label.emoji} {label.name}
                  </span>
                ))}
              </div>
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicateTask(task);
                  }}
                  className="h-6 w-6 p-0"
                  aria-label="Duplicate task"
                >
                  <Copy className="h-3 w-3" />
                </Button>
<Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShareTask(task);
                    }}
                    className="h-6 w-6 p-0"
                    aria-label="Share task"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

export function TaskSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <Card className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-2 w-16 rounded" />
              <Skeleton className="h-2 w-12 rounded" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-32" />
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