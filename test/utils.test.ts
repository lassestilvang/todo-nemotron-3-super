import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  cn,
  formatDate,
  formatDateTime,
  formatTimeHHMM,
  parseHHMMtoMinutes,
  isOverdue,
  getPriorityColor,
  getPriorityIcon,
  formatRelativeTime,
  getDueDateText,
  isToday,
  isThisWeek,
  formatDuration,
  getTaskProgress,
  getPriorityLabel,
  formatRelativeDate,
  truncateText,
  generateColorFromId,
  isValidHHMM,
  formatDateForInput,
  formatDateTimeForInput,
  sanitizeString,
  generateEmojiFromId,
  generateUUID,
  isValidEmail,
  capitalizeFirst,
  formatDurationFromMinutes,
  getPriorityValue,
  isTaskCompleted,
  isTaskOverdue,
  isTaskDueToday,
  isValidUUID,
  debounce,
} from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined values', () => {
    expect(cn('a', undefined, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('returns "No date" for null/undefined', () => {
    expect(formatDate(null)).toBe('No date');
    expect(formatDate(undefined)).toBe('No date');
  });

  it('formats a valid date', () => {
    const date = new Date('2025-01-15');
    const result = formatDate(date);
    expect(result).toBe(date.toLocaleDateString());
  });
});

describe('formatDateTime', () => {
  it('returns "No deadline" for null/undefined', () => {
    expect(formatDateTime(null)).toBe('No deadline');
    expect(formatDateTime(undefined)).toBe('No deadline');
  });

  it('formats a valid datetime', () => {
    const date = new Date('2025-01-15T14:30:00');
    const result = formatDateTime(date);
    expect(result).toBe(date.toLocaleString());
  });
});

describe('formatTimeHHMM', () => {
  it('returns "00:00" for null/undefined', () => {
    expect(formatTimeHHMM(null)).toBe('00:00');
    expect(formatTimeHHMM(undefined)).toBe('00:00');
  });

  it('formats minutes correctly', () => {
    expect(formatTimeHHMM(0)).toBe('00:00');
    expect(formatTimeHHMM(30)).toBe('00:30');
    expect(formatTimeHHMM(60)).toBe('01:00');
    expect(formatTimeHHMM(90)).toBe('01:30');
    expect(formatTimeHHMM(1440)).toBe('24:00');
  });
});

describe('parseHHMMtoMinutes', () => {
  it('parses valid time strings', () => {
    expect(parseHHMMtoMinutes('00:00')).toBe(0);
    expect(parseHHMMtoMinutes('00:30')).toBe(30);
    expect(parseHHMMtoMinutes('01:00')).toBe(60);
    expect(parseHHMMtoMinutes('01:30')).toBe(90);
    expect(parseHHMMtoMinutes('24:00')).toBe(1440);
  });

  it('handles malformed input gracefully', () => {
    expect(parseHHMMtoMinutes(':')).toBe(0);
    expect(parseHHMMtoMinutes('abc')).toBeNaN();
  });
});

describe('isOverdue', () => {
  it('returns false when no deadline', () => {
    expect(isOverdue(null, false)).toBe(false);
    expect(isOverdue(undefined, false)).toBe(false);
  });

  it('returns false for completed tasks', () => {
    const past = new Date('2020-01-01');
    expect(isOverdue(past, true)).toBe(false);
  });

  it('returns true for past deadlines on incomplete tasks', () => {
    const past = new Date('2020-01-01');
    expect(isOverdue(past, false)).toBe(true);
  });

  it('returns false for future deadlines', () => {
    const future = new Date('2099-01-01');
    expect(isOverdue(future, false)).toBe(false);
  });
});

describe('getPriorityColor', () => {
  it('returns correct colors for each priority', () => {
    expect(getPriorityColor('high')).toContain('red');
    expect(getPriorityColor('medium')).toContain('yellow');
    expect(getPriorityColor('low')).toContain('green');
    expect(getPriorityColor('none')).toContain('gray');
    expect(getPriorityColor('unknown')).toContain('gray');
  });
});

describe('getPriorityIcon', () => {
  it('returns correct emoji for each priority', () => {
    expect(getPriorityIcon('high')).toBe('🔴');
    expect(getPriorityIcon('medium')).toBe('🟡');
    expect(getPriorityIcon('low')).toBe('🟢');
    expect(getPriorityIcon('none')).toBe('⚪');
    expect(getPriorityIcon('unknown')).toBe('⚪');
  });
});

describe('formatRelativeTime', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatRelativeTime(null)).toBe('');
    expect(formatRelativeTime(undefined)).toBe('');
  });

  it('returns "just now" for recent dates', () => {
    expect(formatRelativeTime(new Date())).toBe('just now');
  });

  it('returns "Xm ago" for minutes', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns "Xh ago" for hours', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns "Xd ago" for days', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });
});

describe('getDueDateText', () => {
  it('returns "No deadline" for null', () => {
    expect(getDueDateText(null)).toBe('No deadline');
  });

  it('returns "Due Today" for today', () => {
    expect(getDueDateText(new Date())).toBe('Due Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(getDueDateText(tomorrow)).toBe('Tomorrow');
  });

  it('returns "Overdue" for past dates', () => {
    const past = new Date('2020-01-01');
    expect(getDueDateText(past)).toBe('Overdue');
  });
});

describe('isToday', () => {
  it('returns false for null', () => {
    expect(isToday(null)).toBe(false);
  });

  it('returns true for today', () => {
    expect(isToday(new Date())).toBe(true);
  });

  it('returns false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('isThisWeek', () => {
  it('returns false for null', () => {
    expect(isThisWeek(null)).toBe(false);
  });

  it('returns true for today', () => {
    expect(isThisWeek(new Date())).toBe(true);
  });

  it('returns false for dates older than a week', () => {
    const old = new Date();
    old.setDate(old.getDate() - 8);
    expect(isThisWeek(old)).toBe(false);
  });
});

describe('formatDuration', () => {
  it('formats minutes', () => {
    expect(formatDuration(30)).toBe('30m');
    expect(formatDuration(0)).toBe('0m');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(60)).toBe('1h');
  });

  it('formats days and hours', () => {
    expect(formatDuration(1500)).toBe('1d 1h');
    expect(formatDuration(1440)).toBe('1d 0h');
  });
});

describe('getTaskProgress', () => {
  it('uses task completion when no subtasks', () => {
    expect(getTaskProgress(undefined, true)).toEqual({ completed: 1, total: 1, percentage: 100 });
    expect(getTaskProgress(undefined, false)).toEqual({ completed: 0, total: 1, percentage: 0 });
  });

  it('counts completed subtasks', () => {
    const subtasks = [
      { completed: true },
      { completed: false },
      { completed: true },
    ];
    expect(getTaskProgress(subtasks, false)).toEqual({ completed: 2, total: 3, percentage: 67 });
  });

  it('handles empty subtasks array', () => {
    expect(getTaskProgress([], true)).toEqual({ completed: 1, total: 1, percentage: 100 });
  });
});

describe('getPriorityLabel', () => {
  it('returns correct labels for each priority', () => {
    expect(getPriorityLabel('high')).toBe('High');
    expect(getPriorityLabel('medium')).toBe('Medium');
    expect(getPriorityLabel('low')).toBe('Low');
    expect(getPriorityLabel('none')).toBe('None');
  });
});

describe('formatRelativeDate', () => {
  it('returns "No date" for null/undefined', () => {
    expect(formatRelativeDate(null)).toBe('No date');
    expect(formatRelativeDate(undefined)).toBe('No date');
  });

  it('returns "Today" for today', () => {
    expect(formatRelativeDate(new Date())).toBe('Today');
  });

  it('returns "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatRelativeDate(tomorrow)).toBe('Tomorrow');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });
});

describe('formatRelativeDate', () => {
  it('returns date string for dates more than 7 days away', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 10);
    const result = formatRelativeDate(farFuture);
    expect(result).not.toBe('Today');
    expect(result).not.toBe('Tomorrow');
    expect(result).not.toBe('Yesterday');
    expect(result).not.toBe('No date');
  });

  it('returns date string for dates more than 7 days in past', () => {
    const farPast = new Date();
    farPast.setDate(farPast.getDate() - 10);
    const result = formatRelativeDate(farPast);
    expect(result).not.toBe('Yesterday');
    expect(result).not.toBe('Today');
    expect(result).not.toBe('No date');
  });
});

describe('truncateText', () => {
  it('returns original text if within limit', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('truncates text with ellipsis if over limit', () => {
    expect(truncateText('hello world', 5)).toBe('hello...');
  });
});

describe('generateColorFromId', () => {
  it('returns a valid Tailwind color class', () => {
    const color = generateColorFromId('test-id');
    expect(color).toMatch(/^bg-.*-500$/);
  });

  it('is consistent for same ID', () => {
    expect(generateColorFromId('test-id')).toBe(generateColorFromId('test-id'));
  });
});

describe('isValidHHMM', () => {
  it('returns true for valid time strings', () => {
    expect(isValidHHMM('00:00')).toBe(true);
    expect(isValidHHMM('23:59')).toBe(true);
    expect(isValidHHMM('1:30')).toBe(true);
    expect(isValidHHMM('09:05')).toBe(true);
  });

  it('returns false for invalid time strings', () => {
    expect(isValidHHMM('')).toBe(false);
    expect(isValidHHMM('abc')).toBe(false);
    expect(isValidHHMM('25:00')).toBe(false);
    expect(isValidHHMM('12:60')).toBe(false);
    expect(isValidHHMM('12')).toBe(false);
    expect(isValidHHMM('100:00')).toBe(false);
  });
});

describe('formatDateForInput', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDateForInput(null)).toBe('');
    expect(formatDateForInput(undefined)).toBe('');
  });

  it('returns YYYY-MM-DD format for valid dates', () => {
    const date = new Date('2025-01-15');
    expect(formatDateForInput(date)).toBe('2025-01-15');
  });
});

describe('formatDateTimeForInput', () => {
  it('returns empty string for null/undefined', () => {
    expect(formatDateTimeForInput(null)).toBe('');
    expect(formatDateTimeForInput(undefined)).toBe('');
  });

  it('returns YYYY-MM-DDTHH:MM format for valid dates', () => {
    const date = new Date('2025-01-15T14:30:00');
    expect(formatDateTimeForInput(date)).toBe('2025-01-15T14:30');
  });
});

describe('sanitizeString', () => {
  it('returns original string if within limit', () => {
    expect(sanitizeString('hello', 10)).toBe('hello');
  });

  it('truncates string if over limit', () => {
    expect(sanitizeString('hello world', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(sanitizeString('', 5)).toBe('');
  });
});

describe('generateEmojiFromId', () => {
  it('returns a valid emoji from the emoji list', () => {
    const emoji = generateEmojiFromId('test-id');
    expect(emoji).toBeTruthy();
    expect(typeof emoji).toBe('string');
    expect(emoji.length).toBeGreaterThan(0);
  });

  it('is consistent for same ID', () => {
    expect(generateEmojiFromId('test-id')).toBe(generateEmojiFromId('test-id'));
  });
});

describe('generateUUID', () => {
  it('generates a valid UUID', () => {
    const uuid = generateUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('generates unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    expect(uuids.size).toBe(100);
  });
});

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co')).toBe(true);
    expect(isValidEmail('user+tag@example.org')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
  });
});

describe('capitalizeFirst', () => {
  it('capitalizes the first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('world')).toBe('World');
  });

  it('handles empty string', () => {
    expect(capitalizeFirst('')).toBe('');
  });

  it('handles single character', () => {
    expect(capitalizeFirst('a')).toBe('A');
  });
});

describe('formatDurationFromMinutes', () => {
  it('formats minutes correctly', () => {
    expect(formatDurationFromMinutes(30)).toBe('0h 30m');
    expect(formatDurationFromMinutes(0)).toBe('0h 0m');
  });

  it('formats hours and minutes', () => {
    expect(formatDurationFromMinutes(90)).toBe('1h 30m');
    expect(formatDurationFromMinutes(60)).toBe('1h 0m');
  });

  it('handles null and undefined', () => {
    expect(formatDurationFromMinutes(null)).toBe('0h 0m');
    expect(formatDurationFromMinutes(undefined)).toBe('0h 0m');
  });
});

describe('getPriorityValue', () => {
  it('returns correct numeric values for priorities', () => {
    expect(getPriorityValue('high')).toBe(1);
    expect(getPriorityValue('medium')).toBe(2);
    expect(getPriorityValue('low')).toBe(3);
    expect(getPriorityValue('none')).toBe(4);
  });
});

describe('isTaskCompleted', () => {
  it('returns true when completed is true', () => {
    expect(isTaskCompleted(true)).toBe(true);
  });

  it('returns false when completed is false', () => {
    expect(isTaskCompleted(false)).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(isTaskCompleted(null)).toBe(false);
    expect(isTaskCompleted(undefined)).toBe(false);
  });
});

describe('isTaskOverdue', () => {
  it('returns false when no deadline', () => {
    expect(isTaskOverdue(null, false)).toBe(false);
  });

  it('returns false for completed tasks', () => {
    const past = new Date('2020-01-01');
    expect(isTaskOverdue(past, true)).toBe(false);
  });

  it('returns true for past deadlines on incomplete tasks', () => {
    const past = new Date('2020-01-01');
    expect(isTaskOverdue(past, false)).toBe(true);
  });
});

describe('isTaskDueToday', () => {
  it('returns true for tasks due today', () => {
    const today = new Date();
    expect(isTaskDueToday(today)).toBe(true);
  });

  it('returns false for tasks without deadline', () => {
    expect(isTaskDueToday(null)).toBe(false);
  });

  it('returns false for tasks due in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(isTaskDueToday(future)).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('returns true for valid UUID', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUUID('00000000-0000-4000-8000-000000000000')).toBe(true);
  });

  it('returns false for invalid UUID', () => {
    expect(isValidUUID('invalid-uuid')).toBe(false);
    expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('not-a-uuid-at-all')).toBe(false);
  });
});

describe('debounce', () => {
  it('delays function execution', async () => {
    let callCount = 0;
    const debouncedFn = debounce(() => callCount++, 50);

    debouncedFn();
    expect(callCount).toBe(0);

    await new Promise(r => setTimeout(r, 100));
    expect(callCount).toBe(1);
  });

  it('only calls once when called multiple times', async () => {
    let callCount = 0;
    const debouncedFn = debounce(() => callCount++, 50);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    await new Promise(r => setTimeout(r, 100));
    expect(callCount).toBe(1);
  });

  it('passes arguments to debounced function', async () => {
    let received: string | undefined;
    const debouncedFn = debounce((arg: string) => { received = arg; }, 50);

    debouncedFn('hello');

    await new Promise(r => setTimeout(r, 100));
    expect(received).toBe('hello');
  });

  it('handles multiple debounced functions independently', async () => {
    let countA = 0;
    let countB = 0;
    const debouncedA = debounce(() => countA++, 50);
    const debouncedB = debounce(() => countB++, 50);

    debouncedA();
    debouncedA();
    debouncedB();

    await new Promise(r => setTimeout(r, 100));
    expect(countA).toBe(1);
    expect(countB).toBe(1);
  });
});
