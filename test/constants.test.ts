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
