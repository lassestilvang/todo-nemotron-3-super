'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Loader } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Folder } from 'lucide-react';
import { Task } from '@/app/(dashboard)/page';

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
          onSelectTask(task.id);
        }
        break;
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  }, [tasks, onSelectTask]);

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
              onToggleComplete={onToggleComplete}
              onSelectTask={onSelectTask}
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
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onSelectTask: (taskId: string) => void;
  isSelected: boolean;
  isDragging: boolean;
  isFocused: boolean;
  isOperatingOnTask: boolean;
}

function SortableTaskItem({
  task,
  index,
  onToggleComplete,
  onSelectTask,
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
    listeners.onMouseDown(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-shadow hover:shadow-lg cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''} ${isDragging ? 'shadow-xl ring-2 ring-primary' : ''}`}
      onMouseDown={handleDragStart}
      role="listitem"
      aria-posinset={index + 1}
      aria-setsize={tasks.length}
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