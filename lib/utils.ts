import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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