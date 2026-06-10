"use client"

import { toast } from 'sonner';
import type { Task, List, Label } from '@/types/task';

export interface ExportData {
  tasks: Task[];
  lists: List[];
  labels: Label[];
  exportedAt: string;
}

export function exportTasks(tasks: Task[], lists: List[], labels: Label[]): void {
  const data: Omit<ExportData, 'tasks'> & { tasks: any[] } = {
    tasks: tasks.map(t => ({
      ...t,
      date: t.date?.toISOString() || null,
      deadline: t.deadline?.toISOString() || null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    lists,
    labels,
    exportedAt: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  toast.success('Tasks exported successfully');
}

export async function importTasks(file: File, onSuccess?: (data: ExportData) => void): Promise<ExportData | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        
        if (!data.tasks || !Array.isArray(data.tasks)) {
          throw new Error('Invalid file format: missing tasks array');
        }
        
        toast.success(`Import ready: ${data.tasks.length} tasks, ${data.lists?.length || 0} lists, ${data.labels?.length || 0} labels`);
        
        if (onSuccess) {
          onSuccess(data);
        }
        
        resolve(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON file';
        toast.error(message);
        reject(error);
      }
    };
    
    reader.onerror = () => {
      const error = new Error('Failed to read file');
      toast.error(error.message);
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

export function setupExportImportHandlers(
  tasksList: Task[],
  lists: List[],
  labels: Label[],
  onImportSuccess?: (data: ExportData) => void
): {
  handleExport: () => void;
  handleImport: (file: File) => Promise<void>;
} {
  const handleExport = () => {
    exportTasks(tasksList, lists, labels);
  };
  
  const handleImport = async (file: File) => {
    try {
      await importTasks(file, onImportSuccess);
    } catch (error) {
      // Error already handled in importTasks
    }
  };
  
  return { handleExport, handleImport };
}