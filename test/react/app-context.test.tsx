import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/lib/app-context';

jest.mock('@paralleldrive/cuid2', () => ({
  createId: () => 'test-id-123',
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('useApp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
  });

  it('provides default values', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.activeView).toBe('today');
    expect(result.current.showCompleted).toBe(false);
    expect(result.current.focusMode).toBe(false);
  });

  it('provides list management methods', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.refreshLists).toBeDefined();
    expect(result.current.addList).toBeDefined();
    expect(result.current.lists).toEqual([]);
  });

  it('provides label management methods', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.refreshLabels).toBeDefined();
    expect(result.current.addLabel).toBeDefined();
    expect(result.current.labels).toEqual([]);
  });

  it('provides task counts', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    // Task counts are fetched asynchronously, so we check initial state
    expect(result.current.taskCounts).toEqual({ total: 0, completed: 0 });
    expect(result.current.streak).toBe(0);
  });

  it('provides filter methods', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.setFilterListId).toBeDefined();
    expect(result.current.setFilterLabelId).toBeDefined();
    expect(result.current.filterListId).toBeNull();
    expect(result.current.filterLabelId).toBeNull();
  });

  it('provides sort methods', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.setSortBy).toBeDefined();
    expect(result.current.sortBy).toBe('newest');
  });

  it('toggles showCompleted and persists to localStorage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const localStorageMock = {
      store: {},
      getItem: jest.fn((key) => localStorageMock.store[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageMock.store[key] = value;
      }),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    act(() => {
      result.current.setShowCompleted(true);
    });

    expect(result.current.showCompleted).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('todo_showCompleted', 'true');
  });

  it('changes active view', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setActiveView('next7');
    });

    expect(result.current.activeView).toBe('next7');
  });

  it('changes sort order', () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setSortBy('due-date');
    });

    expect(result.current.sortBy).toBe('due-date');
  });
});