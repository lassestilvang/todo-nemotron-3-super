'use client';

import * as React from 'react';
import {
  Calendar,
  CheckCircle,
  Command as CommandIcon,
  Plus,
  Search,
  Target,
  List as ListIcon,
  Inbox,
  LayoutDashboard,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Command } from 'cmdk';
import { useApp } from '@/lib/app-context';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const { 
    setActiveView, 
    setFocusMode, 
    focusMode, 
    lists, 
    setFilterListId,
    setFilterLabelId,
    labels 
  } = useApp();
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Global Command Palette"
        className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 pointer-events-none"
      >
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] pointer-events-auto" onClick={() => setOpen(false)} />
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-950 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-900">
            <Search className="h-4 w-4 text-slate-400 mr-3" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent border-none focus:ring-0 text-sm outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-500 uppercase">
              Esc
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-none">
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              No results found.
            </Command.Empty>

            <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => setActiveView('today'))}>
                <Calendar className="h-4 w-4 mr-3" />
                <span>Go to Today</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setActiveView('next7'))}>
                <CheckCircle className="h-4 w-4 mr-3" />
                <span>Go to Next 7 Days</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => setActiveView('all'))}>
                <ListIcon className="h-4 w-4 mr-3" />
                <span>Go to All Tasks</span>
              </CommandItem>
            </Command.Group>

            <Command.Group heading="Actions" className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => setFocusMode(!focusMode))}>
                <Target className="h-4 w-4 mr-3" />
                <span>{focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode'}</span>
                <CommandShortcut>⌘F</CommandShortcut>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => { /* Add Task Modal */ })}>
                <Plus className="h-4 w-4 mr-3" />
                <span>Create New Task</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
            </Command.Group>

            <Command.Group heading="Lists" className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <CommandItem onSelect={() => runCommand(() => { setFilterListId(null); setActiveView('today'); })}>
                <Inbox className="h-4 w-4 mr-3" />
                <span>Inbox</span>
              </CommandItem>
              {lists.map(list => (
                <CommandItem key={list.id} onSelect={() => runCommand(() => setFilterListId(list.id))}>
                  <div className={`h-2 w-2 rounded-full ${list.color} mr-4`} />
                  <span>{list.name}</span>
                </CommandItem>
              ))}
            </Command.Group>

            <Command.Group heading="Labels" className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {labels.map(label => (
                <CommandItem key={label.id} onSelect={() => runCommand(() => setFilterLabelId(label.id))}>
                  <span className="mr-3">{label.emoji}</span>
                  <span>{label.name}</span>
                </CommandItem>
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-900">
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                   <div className="flex items-center justify-center w-5 h-5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                      <ChevronUp className="w-3 h-3 text-slate-500" />
                   </div>
                   <div className="flex items-center justify-center w-5 h-5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                      <ChevronDown className="w-3 h-3 text-slate-500" />
                   </div>
                   <span className="text-[10px] font-medium text-slate-400">Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="flex items-center justify-center w-10 h-5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-500">Enter</span>
                   </div>
                   <span className="text-[10px] font-medium text-slate-400">Select</span>
                </div>
             </div>
             <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                <CommandIcon className="w-3 h-3" />
                Nemotron Palette
             </span>
          </div>
        </div>
      </Command.Dialog>

      <style jsx global>{`
        [cmdk-item][aria-selected='true'] {
          background: rgba(var(--primary-rgb), 0.1);
          color: var(--primary);
        }
        [cmdk-item][aria-disabled='true'] {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </>
  );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center px-3 py-2.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 aria-selected:bg-slate-100 dark:aria-selected:bg-slate-900 aria-selected:text-slate-900 dark:aria-selected:text-slate-100 cursor-pointer transition-colors"
    >
      {children}
    </Command.Item>
  );
}

function CommandShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-xs font-medium text-slate-400 tracking-widest uppercase">
      {children}
    </span>
  );
}
