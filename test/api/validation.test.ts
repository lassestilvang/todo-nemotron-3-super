import { describe, it, expect } from 'bun:test';
import {
  validateRequired,
  validateString,
  validateEnum,
  validateDate,
  validatePositiveNumber,
  validateBoolean,
  validateField,
  sendError,
  sendSuccess,
  sendValidationError,
} from '@/lib/validation';

describe('validateRequired', () => {
  it('returns error message for null', () => {
    expect(validateRequired(null, 'Field')).toBe('Field is required');
  });

  it('returns error message for undefined', () => {
    expect(validateRequired(undefined, 'Field')).toBe('Field is required');
  });

  it('returns error message for empty string', () => {
    expect(validateRequired('', 'Field')).toBe('Field is required');
  });

  it('returns error message for whitespace-only string', () => {
    expect(validateRequired('   ', 'Field')).toBe('Field is required');
  });

  it('returns null for valid value', () => {
    expect(validateRequired('value', 'Field')).toBeNull();
  });

  it('returns null for number', () => {
    expect(validateRequired(0, 'Field')).toBeNull();
    expect(validateRequired(123, 'Field')).toBeNull();
  });

  it('returns null for boolean false', () => {
    expect(validateRequired(false, 'Field')).toBeNull();
  });
});

describe('validateString', () => {
  it('returns error for non-string', () => {
    expect(validateString(123, 'Field')).toBe('Field must be a string');
  });

  it('returns error for null', () => {
    expect(validateString(null, 'Field')).toBe('Field must be a string');
  });

  it('returns error for undefined', () => {
    expect(validateString(undefined, 'Field')).toBe('Field must be a string');
  });

  it('returns error for empty string', () => {
    expect(validateString('', 'Field')).toBe('Field cannot be empty');
  });

  it('returns error for string exceeding max length', () => {
    expect(validateString('too long string', 'Field', 5)).toBe('Field must be 5 characters or less');
  });

  it('returns null for valid string', () => {
    expect(validateString('valid', 'Field', 10)).toBeNull();
  });

  it('returns null for string at max length', () => {
    expect(validateString('12345', 'Field', 5)).toBeNull();
  });
});

describe('validateEnum', () => {
  it('returns null for valid enum value', () => {
    expect(validateEnum('high', 'priority', ['high', 'medium', 'low'])).toBeNull();
  });

  it('returns error for invalid enum value', () => {
    expect(validateEnum('urgent', 'priority', ['high', 'medium', 'low'])).toBe('Invalid priority value');
  });

  it('returns null for undefined value', () => {
    expect(validateEnum(undefined, 'priority', ['high', 'medium', 'low'])).toBeNull();
  });

  it('returns null for null value', () => {
    expect(validateEnum(null, 'priority', ['high', 'medium', 'low'])).toBeNull();
  });

  it('handles empty allowed values array', () => {
    expect(validateEnum('anything', 'field', [])).toBe('Invalid field value');
  });
});

describe('validateDate', () => {
  it('returns null for valid date string', () => {
    expect(validateDate('2024-01-15', 'date')).toBeNull();
  });

  it('returns null for valid Date object', () => {
    expect(validateDate(new Date(), 'date')).toBeNull();
  });

  it('returns error for invalid date', () => {
    expect(validateDate('not-a-date', 'date')).toBe('Invalid date format');
  });

  it('returns null for undefined', () => {
    expect(validateDate(undefined, 'date')).toBeNull();
  });
});

describe('validatePositiveNumber', () => {
  it('returns null for positive number', () => {
    expect(validatePositiveNumber(10, 'count')).toBeNull();
  });

  it('returns null for zero', () => {
    expect(validatePositiveNumber(0, 'count')).toBeNull();
  });

  it('returns error for negative number', () => {
    expect(validatePositiveNumber(-5, 'count')).toBe('count must be a positive number');
  });

  it('returns null for undefined', () => {
    expect(validatePositiveNumber(undefined, 'count')).toBeNull();
  });

  it('returns error for string', () => {
    expect(validatePositiveNumber('10', 'count')).toBe('count must be a positive number');
  });
});

describe('validateBoolean', () => {
  it('returns null for true', () => {
    expect(validateBoolean(true, 'flag')).toBeNull();
  });

  it('returns null for false', () => {
    expect(validateBoolean(false, 'flag')).toBeNull();
  });

  it('returns error for non-boolean string', () => {
    expect(validateBoolean('true', 'flag')).toBe('flag must be a boolean');
  });

  it('returns error for number', () => {
    expect(validateBoolean(1, 'flag')).toBe('flag must be a boolean');
  });

  it('returns error for object', () => {
    expect(validateBoolean({}, 'flag')).toBe('flag must be a boolean');
  });
});

describe('validateField', () => {
  it('returns null when validator passes', () => {
    const result = validateField('value', 'field', (v) => v ? null : 'error');
    expect(result).toBeNull();
  });

  it('returns error object when validator fails', () => {
    const result = validateField('', 'field', (v) => v ? null : 'Field is required');
    expect(result).toEqual({ field: 'field', message: 'Field is required' });
  });

  it('returns null for undefined value when validator returns null', () => {
    const result = validateField(undefined, 'field', (v) => null);
    expect(result).toBeNull();
  });
});

describe('sendError', () => {
  it('returns NextResponse with error message', () => {
    const response = sendError('Not found', 404);
    expect(response.status).toBe(404);
  });
});

describe('sendSuccess', () => {
  it('returns NextResponse with data', () => {
    const response = sendSuccess({ id: 1 }, 200);
    expect(response.status).toBe(200);
  });
});

describe('sendValidationError', () => {
  it('returns NextResponse with errors array', () => {
    const errors = [{ field: 'name', message: 'Required' }];
    const response = sendValidationError(errors, 400);
    expect(response.status).toBe(400);
  });
});