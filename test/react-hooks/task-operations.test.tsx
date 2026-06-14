import { renderHook, act } from '@testing-library/react';
import { useTaskOperations } from '@/hooks/task-operations';

jest.mock('@/lib/cache', () => ({
  apiCache: { invalidateTasks: jest.fn() },
}));

jest.mock('canvas-confetti', () => {
  const mockFn = jest.fn();
  return { default: mockFn };
});
jest.mock('sonner', () => ({
  toast: { success: jest.fn(() => {}), error: jest.fn(() => {}) },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

interface MockTask {
  id: string;
  name: string;
  completed: boolean;
  listId: string;
  priority: string;
  description: string | null;
  date: Date | null;
  deadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  recurrence: string;
  estimate: number | null;
  actualTime: number | null;
  reminders: string | null;
  snoozedUntil: Date | null;
}

describe('useTaskOperations', () => {
  const createMockTask = (overrides: Partial<MockTask> = {}): MockTask => ({
    id: 'task-1', name: 'Task 1', completed: false, listId: 'list-1', priority: 'medium',
    description: null, date: null, deadline: null, createdAt: new Date(), updatedAt: new Date(),
    recurrence: 'none', estimate: null, actualTime: null, reminders: null, snoozedUntil: null, ...overrides
  });

  const mockTasks = [createMockTask({ id: 'task-1', completed: false }), createMockTask({ id: 'task-2', completed: true })];
  const mockSetTasksList = jest.fn();
  const mockSetSelectedTaskIds = jest.fn();
  const mockSetOperatingOnTaskId = jest.fn();
  const mockFetchTasks = jest.fn();

  beforeEach(() => { jest.clearAllMocks(); });

  it('returns expected methods', () => {
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds: new Set(),
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    expect(result.current).toHaveProperty('handleToggleComplete');
    expect(result.current).toHaveProperty('handleSelectTask');
    expect(result.current).toHaveProperty('handleSelectAll');
    expect(result.current).toHaveProperty('handleBulkComplete');
    expect(result.current).toHaveProperty('handleBulkDelete');
    expect(result.current).toHaveProperty('handleReorderTasks');
  });

  it('handles toggle complete', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds: new Set(),
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleToggleComplete('task-1', true); });
    expect(mockFetch).toHaveBeenCalled();
  });

  it('handles select task', () => {
    const selectedTaskIds = new Set<string>();
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    act(() => { result.current.handleSelectTask('task-1'); });
    expect(mockSetSelectedTaskIds).toHaveBeenCalled();
  });

  it('handles select all', () => {
    const selectedTaskIds = new Set<string>();
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    act(() => { result.current.handleSelectAll(); });
    expect(mockSetSelectedTaskIds).toHaveBeenCalled();
  });

  it('handles bulk complete', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const selectedTaskIds = new Set(['task-1', 'task-2']);
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleBulkComplete(true); });
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/bulk', expect.objectContaining({ method: 'POST' }));
  });

  it('handles bulk delete', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const selectedTaskIds = new Set(['task-1']);
    const { result } = renderHook(() => useTaskOperations({
      tasksList: [mockTasks[0]], setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleBulkDelete(); });
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/bulk', expect.objectContaining({ method: 'POST' }));
  });

  it('handles reorder tasks', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds: new Set(),
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleReorderTasks(['task-2', 'task-1']); });
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/reorder', expect.objectContaining({ method: 'PUT' }));
  });

  it('does nothing on bulk complete with empty selection', async () => {
    const selectedTaskIds = new Set<string>();
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleBulkComplete(true); });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('does nothing on bulk delete with empty selection', async () => {
    const selectedTaskIds = new Set<string>();
    const { result } = renderHook(() => useTaskOperations({
      tasksList: mockTasks, setTasksList: mockSetTasksList, selectedTaskIds,
      setSelectedTaskIds: mockSetSelectedTaskIds, setOperatingOnTaskId: mockSetOperatingOnTaskId, fetchTasks: mockFetchTasks
    }));
    await act(async () => { await result.current.handleBulkDelete(); });
    expect(mockFetch).not.toHaveBeenCalled();
  });
});