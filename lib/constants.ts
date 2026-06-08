import type { Priority, Recurrence } from '@/types/task';

export const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekday', label: 'Weekdays' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

export const PRIORITY_OPTIONS: { value: Priority; label: string; color: string }[] = [
  { value: 'none', label: 'No Priority', color: 'bg-gray-100' },
  { value: 'low', label: 'Low', color: 'bg-green-100' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100' },
  { value: 'high', label: 'High', color: 'bg-red-100' },
];

export const DEFAULT_LISTS = [
  { name: 'Inbox', color: 'bg-blue-500', emoji: '📥' },
  { name: 'Work', color: 'bg-purple-500', emoji: '💼' },
  { name: 'Personal', color: 'bg-pink-500', emoji: '👤' },
];

export const DEFAULT_LABELS = [
  { name: 'Important', color: 'bg-red-500', emoji: '🔴' },
  { name: 'Meeting', color: 'bg-blue-500', emoji: '📅' },
  { name: 'Call', color: 'bg-green-500', emoji: '📞' },
];

export const KEYBOARD_SHORTCUTS = {
  ADD_TASK: 'Ctrl+Shift+A',
  ADD_LIST: 'Ctrl+Shift+L',
  ADD_LABEL: 'Ctrl+Shift+K',
  TOGGLE_COMPLETE: 'Ctrl+C',
  SEARCH: 'Ctrl+K',
  QUICK_ADD: 'Ctrl+Enter',
  SHOW_HELP: 'Shift+?',
};

export const DEFAULT_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-slate-500', 'bg-gray-500', 'bg-zinc-500',
];

export const DEFAULT_EMOJIS = ['📥', '📋', '📝', '✅', '📌', '🏷️', '💼', '🏠', '🎯', '📚', '🛒', '💡', '⚡', '🎨', '🎮', '🎵'];