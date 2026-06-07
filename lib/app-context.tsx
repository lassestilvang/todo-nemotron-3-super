'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { db } from '@/app/lib/db/index';
import { lists, labels } from '@/app/lib/db/schema';
import { apiCache } from '@/lib/cache';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState<ViewType>('today');
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterListId, setFilterListId] = useState<string | null>(null);
  const [filterLabelId, setFilterLabelId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [lists, setLists] = useState<List[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [labelsLoading, setLabelsLoading] = useState(true);

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
      const result = await db.select().from(lists) as unknown as List[];
      const formatted = result.map((list) => ({
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
      const result = await db.select().from(labels) as unknown as Label[];
      const formatted = result.map((label) => ({
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

  useEffect(() => {
    fetchLists();
    fetchLabels();
  }, []);

  const addList = async (name: string, color: string, emoji: string) => {
    try {
      const { createId } = await import('@paralleldrive/cuid2');
      const id = createId();
      await db.insert(lists).values({ id, name, color, emoji });
      apiCache.delete('app_lists');
      await fetchLists();
    } catch (error) {
      console.error('Failed to add list:', error);
      throw error;
    }
  };

  const addLabel = async (name: string, color: string, emoji: string) => {
    try {
      const { createId } = await import('@paralleldrive/cuid2');
      const id = createId();
      await db.insert(labels).values({ id, name, color, emoji });
      apiCache.delete('app_labels');
      await fetchLabels();
    } catch (error) {
      console.error('Failed to add label:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      activeView,
      setActiveView,
      showCompleted,
      setShowCompleted,
      filterListId,
      setFilterListId,
      filterLabelId,
      setFilterLabelId,
      sortBy,
      setSortBy,
      lists,
      labels,
      listsLoading,
      labelsLoading,
      refreshLists: fetchLists,
      refreshLabels: fetchLabels,
      addList,
      addLabel,
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