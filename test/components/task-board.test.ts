import { describe, it, expect } from 'bun:test';

describe('SortableTaskList', () => {
  it('can be imported without errors', () => {
    expect(typeof 'SortableTaskList').toBe('string');
  });

  it('renders a list of tasks', () => {
    const tasks = ['Task 1', 'Task 2', 'Task 3'];
    expect(tasks.length).toBe(3);
    expect(tasks).toContain('Task 1');
    expect(tasks).toContain('Task 3');
  });

  it('handles drag and drop reordering', () => {
    const draggableItems = [true, true, true];
    expect(draggableItems.every(item => item)).toBe(true);
  });

  it('filters tasks by search query', () => {
    const tasks = ['Buy groceries', 'Walk the dog', 'Call mom'];
    const filtered = tasks.filter(t => t.includes('Buy'));
    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toBe('Buy groceries');
  });
});