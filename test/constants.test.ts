import { describe, it, expect } from 'bun:test';
import {
  RECURRENCE_OPTIONS,
  PRIORITY_OPTIONS,
  DEFAULT_LISTS,
  DEFAULT_LABELS,
  KEYBOARD_SHORTCUTS,
  DEFAULT_COLORS,
  DEFAULT_EMOJIS,
} from '@/lib/constants';
import {
  isValidUUID,
  formatDurationFromMinutes,
  getPriorityValue,
  isTaskDueToday,
} from '@/lib/utils';
import type { Task } from '@/types/task';

describe('RECURRENCE_OPTIONS', () => {
  it('contains all recurrence types', () => {
    const values = RECURRENCE_OPTIONS.map(o => o.value);
    expect(values).toContain('none');
    expect(values).toContain('daily');
    expect(values).toContain('weekly');
    expect(values).toContain('weekday');
    expect(values).toContain('monthly');
    expect(values).toContain('yearly');
    expect(values).toContain('custom');
  });

  it('each option has value and label', () => {
    for (const opt of RECURRENCE_OPTIONS) {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
    }
  });
});

describe('PRIORITY_OPTIONS', () => {
  it('contains all priorities', () => {
    const values = PRIORITY_OPTIONS.map(o => o.value);
    expect(values).toContain('none');
    expect(values).toContain('low');
    expect(values).toContain('medium');
    expect(values).toContain('high');
  });

  it('each option has value, label, and color', () => {
    for (const opt of PRIORITY_OPTIONS) {
      expect(opt).toHaveProperty('value');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('color');
    }
  });
});

describe('DEFAULT_LISTS', () => {
  it('has 3 default lists', () => {
    expect(DEFAULT_LISTS).toHaveLength(3);
  });
});

describe('DEFAULT_LABELS', () => {
  it('has 3 default labels', () => {
    expect(DEFAULT_LABELS).toHaveLength(3);
  });
});

describe('KEYBOARD_SHORTCUTS', () => {
  it('has all expected shortcuts', () => {
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('ADD_TASK');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('ADD_LIST');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('ADD_LABEL');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('TOGGLE_COMPLETE');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('SEARCH');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('QUICK_ADD');
    expect(KEYBOARD_SHORTCUTS).toHaveProperty('SHOW_HELP');
  });
});

describe('DEFAULT_COLORS', () => {
  it('contains at least 10 colors', () => {
    expect(DEFAULT_COLORS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('DEFAULT_EMOJIS', () => {
  it('contains at least 5 emojis', () => {
    expect(DEFAULT_EMOJIS.length).toBeGreaterThanOrEqual(5);
  });
});

describe('isValidUUID', () => {
  it('returns true for valid UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
    expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
  });

  it('returns false for invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123e4567')).toBe(false);
    expect(isValidUUID('')).toBe(false);
  });
});

describe('formatDurationFromMinutes', () => {
  it('formats minutes correctly', () => {
    expect(formatDurationFromMinutes(30)).toBe('0h 30m');
    expect(formatDurationFromMinutes(90)).toBe('1h 30m');
    expect(formatDurationFromMinutes(150)).toBe('2h 30m');
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

describe('isTaskDueToday', () => {
  it('returns true for tasks due today', () => {
    const today = new Date();
    const task: Partial<Task> = { deadline: today };
    expect(isTaskDueToday(task as Task)).toBe(true);
  });

  it('returns false for tasks without deadline', () => {
    const task: Partial<Task> = {};
    expect(isTaskDueToday(task as Task)).toBe(false);
  });
});
