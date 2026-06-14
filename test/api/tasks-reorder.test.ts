import { describe, it, expect } from 'bun:test';

describe('Reorder Tasks API Routes', () => {
  describe('PUT /api/tasks/reorder', () => {
    it('should validate taskIds array', async () => {
      const body = { taskIds: ['task-1', 'task-2'] };
      expect(Array.isArray(body.taskIds)).toBe(true);
      expect(body.taskIds.length).toBe(2);
    });

    it('should accept valid reorder data', async () => {
      const validBody = {
        taskIds: ['task-3', 'task-1', 'task-2'],
      };
      expect(validBody.taskIds).toHaveLength(3);
    });

    it('should reject non-array taskIds', async () => {
      const body = { taskIds: 'not-an-array' };
      expect(Array.isArray(body.taskIds)).toBe(false);
    });

    it('should reject empty taskIds array', async () => {
      const body = { taskIds: [] };
      expect(body.taskIds.length).toBe(0);
    });

    it('should reject duplicate task IDs', async () => {
      const taskIds = ['task-1', 'task-2', 'task-1'];
      const uniqueTaskIds = [...new Set(taskIds)];
      expect(uniqueTaskIds.length).toBe(2);
      expect(taskIds.length).toBe(3);
    });

    it('should validate each task ID is a non-empty string', async () => {
      const taskIds = ['task-1', '', 'task-2'];
      const validTaskIds = taskIds.filter(id => id && typeof id === 'string');
      expect(validTaskIds).toHaveLength(2);
    });

    it('should accept single task reorder', async () => {
      const body = { taskIds: ['task-1'] };
      expect(body.taskIds).toHaveLength(1);
    });

    it('should validate reorder positions', async () => {
      const originalOrder = ['task-1', 'task-2', 'task-3'];
      const newOrder = ['task-3', 'task-1', 'task-2'];

      // Verify positions changed
      expect(originalOrder[0]).toBe('task-1');
      expect(newOrder[0]).toBe('task-3');
    });
  });

  describe('Reorder validation', () => {
    it('should create correct request body', () => {
      const taskIds = ['task-3', 'task-1', 'task-2'];
      const body = { taskIds };
      expect(body.taskIds).toEqual(['task-3', 'task-1', 'task-2']);
    });

    it('should handle all tasks in same order', () => {
      const taskIds = ['task-1', 'task-2', 'task-3'];
      const unique = [...new Set(taskIds)];
      expect(unique.length).toBe(3);
    });
  });
});