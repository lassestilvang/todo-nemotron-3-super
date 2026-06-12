'use client';

import { useState } from 'react';
import {
  Plus,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  List,
  Inbox,
  Tag,
  BarChart3,
  CheckCircle,
  Circle,
  Filter,
  SortAsc,
  PieChart,
  Download,
  Printer,
  Upload,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { DEFAULT_LISTS, DEFAULT_LABELS } from '@/lib/constants';
import { useApp } from '@/lib/app-context';
import CreateItemDialog from '@/components/dialogs/CreateItemDialog';

const viewOptions = [
  { name: 'Today', value: 'today', icon: Calendar },
  { name: 'Next 7 Days', value: 'next7', icon: CalendarCheck },
  { name: 'Upcoming', value: 'upcoming', icon: CalendarPlus },
  { name: 'All Tasks', value: 'all', icon: List },
];

export default function Sidebar() {
  const {
    activeView,
    setActiveView,
    lists,
    labels,
    listsLoading,
    labelsLoading,
    filterListId,
    setFilterListId,
    filterLabelId,
    setFilterLabelId,
    showCompleted,
    setShowCompleted,
    sortBy,
    setSortBy,
    addList,
    addLabel,
    taskCounts,
    focusMode,
  } = useApp();

  const [isAddingList, setIsAddingList] = useState(false);
  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isViewsExpanded, setIsViewsExpanded] = useState(true);
  const [isListsExpanded, setIsListsExpanded] = useState(true);
  const [isLabelsExpanded, setIsLabelsExpanded] = useState(true);

  const handleAddList = async (name: string, color: string, emoji: string) => {
    try {
      await addList(name, color, emoji);
      toast.success('List added');
    } catch (error) {
      console.error('Failed to add list:', error);
      toast.error('Failed to add list');
    }
  };

  const handleAddLabel = async (name: string, color: string, emoji: string) => {
    try {
      await addLabel(name, color, emoji);
      toast.success('Label added');
    } catch (error) {
      console.error('Failed to add label:', error);
      toast.error('Failed to add label');
    }
  };

  if (focusMode) return null;

  return (
    <div className="w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col h-screen overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            T
          </div>
          <span className="font-bold text-lg tracking-tight">Nemotron</span>
        </div>

        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] pr-2 -mr-2 scrollbar-none">
          {/* Views Section */}
          <div>
            <button 
              onClick={() => setIsViewsExpanded(!isViewsExpanded)}
              className="flex items-center justify-between w-full px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <span>Views</span>
              {isViewsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isViewsExpanded && (
              <div className="space-y-1">
                {viewOptions.map((view) => (
                  <Button
                    key={view.value}
                    variant="ghost"
                    className={`w-full justify-start px-2 py-1.5 h-9 rounded-md transition-all ${
                      activeView === view.value 
                        ? 'bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 font-medium' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                    }`}
                    onClick={() => setActiveView(view.value as any)}
                  >
                    <view.icon className={`h-4 w-4 mr-3 ${activeView === view.value ? 'text-primary' : ''}`} />
                    <span className="flex-1 text-sm">{view.name}</span>
                    {activeView === view.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Lists Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <button 
                onClick={() => setIsListsExpanded(!isListsExpanded)}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <span>Lists</span>
                {isListsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              <button 
                onClick={() => setIsAddingList(true)}
                className="hover:text-primary transition-colors p-0.5"
                aria-label="Add List"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {isListsExpanded && (
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className={`w-full justify-start px-2 py-1.5 h-9 rounded-md ${
                    filterListId === null && activeView === 'today'
                      ? 'bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 font-medium'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => {
                    setFilterListId(null);
                    setActiveView('today');
                  }}
                >
                  <Inbox className="h-4 w-4 mr-3" />
                  <span className="flex-1 text-sm text-left">Inbox</span>
                </Button>
                {listsLoading ? (
                  <div className="px-2 space-y-2 py-2">
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                  </div>
                ) : (
                  lists.map((list) => (
                    <Button
                      key={list.id}
                      variant="ghost"
                      className={`w-full justify-start px-2 py-1.5 h-9 rounded-md ${
                        filterListId === list.id 
                          ? 'bg-white dark:bg-slate-900 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 font-medium' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => setFilterListId(filterListId === list.id ? null : list.id)}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${list.color} mr-4`} />
                      <span className="flex-1 text-sm text-left truncate">{list.name}</span>
                    </Button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Labels Section */}
          <div>
            <div className="flex items-center justify-between px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <button 
                onClick={() => setIsLabelsExpanded(!isLabelsExpanded)}
                className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                <span>Labels</span>
                {isLabelsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              <button 
                onClick={() => setIsAddingLabel(true)}
                className="hover:text-primary transition-colors p-0.5"
                aria-label="Add Label"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            {isLabelsExpanded && (
              <div className="flex flex-wrap gap-1 px-2">
                {labelsLoading ? (
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                ) : (
                  labels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() => setFilterLabelId(filterLabelId === label.id ? null : label.id)}
                      className={`px-2 py-1 rounded text-xs transition-all flex items-center gap-1.5 ${
                        filterLabelId === label.id
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-primary/50'
                      }`}
                    >
                      <span>{label.emoji}</span>
                      <span>{label.name}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stats Section */}
          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
             <div className="px-2 mb-4">
               <div className="flex items-center justify-between mb-2">
                 <span className="text-xs font-semibold text-slate-500 uppercase">Progress</span>
                 <span className="text-xs font-bold text-primary">
                   {taskCounts.total > 0 ? Math.round((taskCounts.completed / taskCounts.total) * 100) : 0}%
                 </span>
               </div>
               <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                 <div 
                   className="h-full bg-primary transition-all duration-500 ease-out"
                   style={{ width: `${taskCounts.total > 0 ? (taskCounts.completed / taskCounts.total) * 100 : 0}%` }}
                 />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2 px-2">
               <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                 <div className="text-[10px] text-slate-500 uppercase mb-1">Done</div>
                 <div className="text-lg font-bold">{taskCounts.completed}</div>
               </div>
               <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                 <div className="text-[10px] text-slate-500 uppercase mb-1">Total</div>
                 <div className="text-lg font-bold">{taskCounts.total}</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 hover:bg-slate-200 dark:hover:bg-slate-800">
              <Settings className="h-4 w-4 mr-3 text-slate-500" />
              <span className="text-sm font-medium">Settings</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-2" />
              Print Tasks
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const data = { lists, labels, tasks: [] };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `todo-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) toast.success('Import started...');
              };
              input.click();
            }}>
              <Upload className="h-4 w-4 mr-2" />
              Import Data
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CreateItemDialog
        isOpen={isAddingList}
        onOpenChange={setIsAddingList}
        title="Create New List"
        type="list"
        onSubmit={handleAddList}
      />

      <CreateItemDialog
        isOpen={isAddingLabel}
        onOpenChange={setIsAddingLabel}
        title="Create New Label"
        type="label"
        onSubmit={handleAddLabel}
      />
    </div>
  );
}