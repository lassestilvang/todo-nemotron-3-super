import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Priority } from '@/types/task';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'No date';
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'No deadline';
  const d = new Date(date);
  return d.toLocaleString();
}

export function formatTimeHHMM(minutes: number | null | undefined): string {
  if (!minutes && minutes !== 0) return '00:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function parseHHMMtoMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  return (parseInt(parts[0] || '0', 10) * 60) + parseInt(parts[1] || '0', 10);
}

export function isOverdue(deadline: Date | null | undefined, completed: boolean): boolean {
  if (!deadline || completed) return false;
  return new Date(deadline) < new Date();
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

export function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high': return '🔴';
    case 'medium': return '🟡';
    case 'low': return '🟢';
    default: return '⚪';
  }
}

export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor(diff / 60000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'just now';
}

export function getDueDateText(deadline: Date | null | undefined): string {
  if (!deadline) return 'No deadline';
  const d = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (d.toDateString() === today.toDateString()) return 'Due Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  if (d < new Date()) return 'Overdue';
  return d.toLocaleDateString();
}

export function isToday(date: Date | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isThisWeek(date: Date | null | undefined): boolean {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return d >= weekAgo && d <= now;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim();
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`.trim();
}

export function getTaskProgress(subtasks: Array<{ completed: boolean }> | undefined, completed: boolean): { completed: number; total: number; percentage: number } {
  if (!subtasks || subtasks.length === 0) {
    return { completed: completed ? 1 : 0, total: 1, percentage: completed ? 100 : 0 };
  }
  const completedCount = subtasks.filter(s => s.completed).length;
  const total = subtasks.length;
  return { completed: completedCount, total, percentage: Math.round((completedCount / total) * 100) };
}

export function getPriorityLabel(priority: Priority): string {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'None';
  }
}

export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return 'No date';
  const d = new Date(date);
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`;
  return d.toLocaleDateString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateColorFromId(id: string): string {
  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  ];
  const index = id.charCodeAt(0) % colors.length;
  return colors[index];
}