import { NextResponse } from 'next/server';

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateString(value: unknown, fieldName: string, maxLength?: number): string | null {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (value.trim() === '') {
    return `${fieldName} cannot be empty`;
  }
  if (maxLength && value.length > maxLength) {
    return `${fieldName} must be ${maxLength} characters or less`;
  }
  return null;
}

export function validateEnum(value: unknown, fieldName: string, allowedValues: string[]): string | null {
  if (value !== undefined && value !== null && !allowedValues.includes(value)) {
    return `Invalid ${fieldName} value`;
  }
  return null;
}

export function validatePositiveNumber(value: unknown, fieldName: string): string | null {
  if (value !== undefined && value !== null) {
    if (typeof value !== 'number' || value < 0) {
      return `${fieldName} must be a positive number`;
    }
  }
  return null;
}

export function validateBoolean(value: unknown, fieldName: string): string | null {
  if (value !== undefined && typeof value !== 'boolean') {
    return `${fieldName} must be a boolean`;
  }
  return null;
}

export function validateDate(value: unknown, fieldName: string): string | null {
  if (value !== undefined && value !== null) {
    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return `Invalid ${fieldName} format`;
    }
  }
  return null;
}

export function sendError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function sendSuccess(data: unknown, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}