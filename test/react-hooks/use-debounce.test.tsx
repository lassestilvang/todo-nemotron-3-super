import { renderHook, act } from '@testing-library/react';
import useDebounce from '@/hooks/use-debounce';

describe('useDebounce', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('handles undefined and null values', () => {
    const { result } = renderHook(() => useDebounce(undefined, 500));
    expect(result.current).toBeUndefined();
  });
});
