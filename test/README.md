# Testing Patterns

This document describes the testing patterns used in this project.

## Test Runners

The project uses two test runners:

1. **Bun Test** (`bun test`) - For pure logic and non-DOM tests
2. **Jest + jsdom** (`bun run test:jest`) - For React components and hooks

## File Naming Conventions

- `test/*.test.ts` - Bun tests for pure logic
- `test/lib/*.test.ts` - Bun tests for library functions
- `test/react-hooks/*.test.tsx` - Jest tests for React hooks
- `test/react/*.test.tsx` - Jest tests for React components

## Testing Patterns

### Bun Tests (bun:test)

```ts
import { test, expect, describe } from 'bun:test';

test('adds numbers', () => {
  expect(1 + 1).toBe(2);
});

describe('grouping tests', () => {
  test('nested test', () => {
    // ...
  });
});
```

### Jest Tests (React)

```tsx
import { render, screen, act } from '@testing-library/react';
import { test, expect, describe } from '@testing-library/react';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Hello')).toBeTruthy();
});

// For hooks
test('returns expected value', () => {
  const { result } = renderHook(() => useCustomHook());
  expect(result.current.value).toBe('expected');
});
```

### Mocking Patterns

#### Mocking ES Module Default Exports

```tsx
jest.mock('module-name', () => {
  const mockFn = jest.fn();
  return { default: mockFn };
});
```

#### Mocking Browser APIs

```tsx
const localStorageMock = {
  store: {},
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
```

#### Mocking fetch

```tsx
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

beforeEach(() => {
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve([]) });
});
```

## Running Tests

```sh
# Run all Bun tests
bun test

# Run all Jest tests
bun run test:jest

# Run with coverage
bun test --coverage
```

## Coverage Goals

- Core libraries: >95%
- React hooks: >80%
- React components: >70%