'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiCache } from '@/lib/cache';
import { createId } from '@paralleldrive/cuid2';

type ViewType = 'today' | 'next7' | 'upcoming' | 'all';

type SortOption = 'newest' | 'oldest' | 'due-date' | 'priority';

interface List {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
  emoji: string;
}

interface AppContextType {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  filterListId: string | null;
  setFilterListId: (id: string | null) => void;
  filterLabelId: string | null;
  setFilterLabelId: (id: string | null) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  lists: List[];
  labels: Label[];
  listsLoading: boolean;
  labelsLoading: boolean;
  refreshLists: () => Promise<void>;
  refreshLabels: () => Promise<void>;
  addList: (name: string, color: string, emoji: string) => Promise<void>;
  addLabel: (name: string, color: string, emoji: string) => Promise<void>;
  taskCounts: { total: number; completed: number };
}

const STORAGE_KEYS = {
  SHOW_COMPLETED: 'todo_showCompleted',
  ACTIVE_VIEW: 'todo_activeView',
  SORT_BY: 'todo_sortBy',
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage disabled or full
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ViewType>(() =>
    loadFromStorage<ViewType>(STORAGE_KEYS.ACTIVE_VIEW, 'today')
  );
  const [showCompleted, setShowCompleted] = useState<boolean>(() =>
    loadFromStorage<boolean>(STORAGE_KEYS.SHOW_COMPLETED, false)
  );
  const [filterListId, setFilterListId] = useState<string | null>(null);
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>(() =>
    loadFromStorage<SortOption>(STORAGE_KEYS.SORT_BY, 'newest')
  );
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [labelsLoading, setLabelsLoading] = useState(true);
  const [taskCounts, setTaskCounts] = useState({ total: 0, completed: 0 });

  const fetchLists = async () => {
    setListsLoading(true);
    try {
      const cacheKey = 'app_lists';
      const cached = apiCache.get<List[]>(cacheKey);
      if (cached) {
        setLists(cached);
        setListsLoading(false);
        return;
      }
      const res = await fetch('/api/lists');
      if (!res.ok) throw new Error('Failed to fetch lists');
      const result = await res.json();
      const formatted = (result as any[]).map((list: any) => ({
        id: list.id,
        name: list.name,
        color: list.color,
        emoji: list.emoji,
      }));
      setLists(formatted);
      apiCache.set(cacheKey, formatted, 300);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    } finally {
      setListsLoading(false);
    }
  };

  const fetchLabels = async () => {
    setLabelsLoading(true);
    try {
      const cacheKey = 'app_labels';
      const cached = apiCache.get<Label[]>(cacheKey);
      if (cached) {
        setLabels(cached);
        setLabelsLoading(false);
        return;
      }
      const res = await fetch('/api/labels');
      if (!res.ok) throw new Error('Failed to fetch labels');
      const result = await res.json();
      const formatted = (result as any[]).map((label: any) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        emoji: label.emoji,
      }));
      setLabels(formatted);
      apiCache.set(cacheKey, formatted, 300);
    } catch (error) {
      console.error('Failed to fetch labels:', error);
    } finally {
      setLabelsLoading(false);
    }
  };

  const fetchTaskCounts = async () => {
    try {
      const res = await fetch('/api/tasks?activeTab=all&showCompleted=true');
      if (res.ok) {
        const tasks = await res.json();
        setTaskCounts({
          total: tasks.length,
          completed: tasks.filter((t: any) => t.completed).length,
        });
      }
    } catch {
      // Silently fail - counts are non-critical
    }
  };

  useEffect(() => {
    fetchLists();
    fetchLabels();
    fetchTaskCounts();
  }, []);

  const addList = async (name: string, color: string, emoji: string) => {
    try {
      const id = createId();
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, color, emoji }),
      });
      if (!res.ok) throw new Error('Failed to add list');
      apiCache.delete('app_lists');
      await fetchLists();
    } catch (error) {
      console.error('Failed to add list:', error);
      throw error;
    }
  };

  const addLabel = async (name: string, color: string, emoji: string) => {
    try {
      const id = createId();
      const res = await fetch('/api/labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name, color, emoji }),
      });
      if (!res.ok) throw new Error('Failed to add label');
      apiCache.delete('app_labels');
      await fetchLabels();
    } catch (error) {
      console.error('Failed to add label:', error);
      throw error;
    }
  };

  const handleSetActiveView = (view: ViewType) => {
    setActiveView(view);
    saveToStorage(STORAGE_KEYS.ACTIVE_VIEW, view);
  };

  const handleSetShowCompleted = (show: boolean) => {
    setShowCompleted(show);
    saveToStorage(STORAGE_KEYS.SHOW_COMPLETED, show);
  };

  const handleSetSortBy = (sort: SortOption) => {
    setSortBy(sort);
    saveToStorage(STORAGE_KEYS.SORT_BY, sort);
  };

  return (
    <AppContext.Provider value={{
      activeView,
      setActiveView: handleSetActiveView,
      showCompleted,
      setShowCompleted: handleSetShowCompleted,
      filterListId,
      setFilterListId,
      filterLabelId,
      setFilterLabelId,
      sortBy,
      setSortBy: handleSetSortBy,
      lists,
      labels,
      listsLoading,
      labelsLoading,
      refreshLists: fetchLists,
      refreshLabels: fetchLabels,
      addList,
      addLabel,
      taskCounts,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
