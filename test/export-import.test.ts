import { describe, it, expect, beforeAll } from 'bun:test';
import { setupExportImportHandlers } from '@/lib/export-import';
import type { Task, List, Label } from '@/types/task';

describe('setupExportImportHandlers', () => {
  it('returns handleExport and handleImport functions', () => {
    const tasks: Task[] = [];
    const lists: List[] = [];
    const labels: Label[] = [];

    const handlers = setupExportImportHandlers(tasks, lists, labels);
    expect(handlers).toHaveProperty('handleExport');
    expect(handlers).toHaveProperty('handleImport');
    expect(typeof handlers.handleExport).toBe('function');
    expect(typeof handlers.handleImport).toBe('function');
  });
});
