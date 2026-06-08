export const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'weekday', label: 'Weekdays' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom' },
];

export const PRIORITY_OPTIONS = [
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