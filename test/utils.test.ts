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
