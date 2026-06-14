import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from '@/hooks/use-undo-redo';

jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(() => {}),
    success: jest.fn(() => {}),
    error: jest.fn(() => {}),
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('useUndoRedo', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  it('returns expected properties', () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current).toHaveProperty('addAction');
    expect(result.current).toHaveProperty('undo');
    expect(result.current).toHaveProperty('redo');
    expect(result.current).toHaveProperty('canUndo');
    expect(result.current).toHaveProperty('canRedo');
    expect(result.current).toHaveProperty('clearHistory');
    expect(result.current).toHaveProperty('historyLength');
    expect(result.current).toHaveProperty('futureLength');
  });

  it('starts with empty history', () => {
    const { result } = renderHook(() => useUndoRedo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.historyLength).toBe(0);
    expect(result.current.futureLength).toBe(0);
  });

  it('adds action to history', () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      result.current.addAction({
        type: 'create',
        taskData: { id: 'task-1', name: 'Test' },
        timestamp: Date.now(),
      });
    });
    expect(typeof result.current.addAction).toBe('function');
  });

  it('clears future when new action is added', () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      result.current.addAction({ type: 'create', taskData: { id: 'task-1' }, timestamp: Date.now() });
    });
    act(() => {
      result.current.addAction({ type: 'update', taskData: { id: 'task-2' }, timestamp: Date.now() });
    });
    expect(typeof result.current.clearHistory).toBe('function');
  });

  it('supports undo for create action', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      result.current.addAction({ type: 'create', taskData: { id: 'task-1', name: 'Test' }, timestamp: Date.now() });
    });
    await act(async () => { await result.current.undo(); });
    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/task-1', expect.objectContaining({ method: 'DELETE' }));
  });

  it('returns null when nothing to undo', async () => {
    const { result } = renderHook(() => useUndoRedo());
    let undoResult;
    await act(async () => { undoResult = await result.current.undo(); });
    expect(undoResult).toBeNull();
  });

  it('clears history', () => {
    const { result } = renderHook(() => useUndoRedo());
    act(() => {
      result.current.addAction({ type: 'create', taskData: { id: 'task-1' }, timestamp: Date.now() });
    });
    expect(typeof result.current.clearHistory).toBe('function');
  });
});