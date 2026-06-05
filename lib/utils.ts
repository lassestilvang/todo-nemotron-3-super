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