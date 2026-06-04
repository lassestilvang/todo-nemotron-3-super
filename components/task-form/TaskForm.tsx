'use client';

import { useState, useEffect } from 'react';
import { 
   Dialog, 
   DialogContent, 
   DialogFooter, 
   DialogHeader, 
   DialogTitle, 
   DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { db } from '@/app/lib/db/index';
import { lists, labels, type List, type Label as LabelType } from '@/app/lib/db/schema';
import { RECURRENCE_OPTIONS } from '@/lib/constants';
import { apiCache } from '@/lib/cache';

interface TaskFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    name: string;
    description: string;
    listId: string;
    date: Date | null;
    deadline: Date | null;
    priority: string;
    recurrence: string;
    labelIds: string[];
  };
  onSubmit: (data: {
    name: string;
    description: string;
    listId: string;
    date: Date | null;
    deadline: Date | null;
    priority: string;
    recurrence: string;
    labelIds: string[];
  }) => Promise<void>;
  submitLabel: string;
  title: string;
  triggerContent: React.ReactNode;
}

interface FormState {
  name: string;
  description: string;
  listId: string;
  date: Date | null;
  deadline: Date | null;
  priority: string;
  recurrence: string;
  labelIds: string[];
}

export default function TaskForm({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  submitLabel,
  title,
  triggerContent,
}: TaskFormProps) {
  const [formData, setFormData] = useState<FormState>(() => ({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    listId: initialData?.listId ?? '',
    date: initialData?.date ?? null,
    deadline: initialData?.deadline ?? null,
    priority: initialData?.priority ?? 'none',
    recurrence: initialData?.recurrence ?? 'none',
    labelIds: initialData?.labelIds ?? [],
  }));
  
  const [listsList, setListsList] = useState<Array<{id: string; name: string; color: string; emoji: string}>>([]);
  const [labelsList, setLabelsList] = useState<Array<{id: string; name: string; color: string; emoji: string}>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch lists and labels when form opens
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    const cacheKey = 'form_lists_labels';
    const cached = apiCache.get<{ lists: Array<{id: string; name: string; color: string; emoji: string}>; labels: Array<{id: string; name: string; color: string; emoji: string}> }>(cacheKey);
    if (cached) {
      setListsList(cached.lists);
      setLabelsList(cached.labels);
      return;
    }
    try {
      const listsResult: List[] = await db.select().from(lists) as unknown as List[];
      const labelsResult: LabelType[] = await db.select().from(labels) as unknown as LabelType[];
      
      const listItems = listsResult.map((list: List) => ({
        id: list.id,
        name: list.name,
        color: list.color,
        emoji: list.emoji,
      }));
      
      const labelItems = labelsResult.map((label: LabelType) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        emoji: label.emoji,
      }));
      
      setListsList(listItems);
      setLabelsList(labelItems);
      apiCache.set(cacheKey, { lists: listItems, labels: labelItems }, 300); // 5 minutes
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit form:', error);
      // In a real app, we'd show an error message
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerContent}
      </DialogTrigger>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="task-name">Task Name</Label>
            <Input
              id="task-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter task name"
              required
            />
          </div>
          <div>
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-list">List</Label>
              <select
                id="task-list"
                value={formData.listId}
                onChange={(e) => setFormData({ ...formData, listId: e.target.value })}
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
              <Label htmlFor="task-priority">Priority</Label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
                value={formData.date ? formData.date.toISOString().split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData({ ...formData, date });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="task-deadline">Deadline</Label>
              <input
                id="task-deadline"
                type="datetime-local"
                value={formData.deadline ? formData.deadline.toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value) : null;
                  setFormData({ ...formData, deadline: date });
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
                 value={formData.recurrence}
                 onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
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
                value={formData.labelIds}
                onChange={(e) => {
                  setFormData({ ...formData, labelIds: Array.from(e.target.selectedOptions).map(opt => opt.value) });
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
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}