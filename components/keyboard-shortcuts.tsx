'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard, X, Search, Copy, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Shortcut {
  keys: string;
  description: string;
  category: 'navigation' | 'tasks' | 'forms' | 'system';
}

const shortcuts: Shortcut[] = [
  { keys: '?', description: 'Show this help dialog', category: 'system' },
  { keys: 'Escape', description: 'Close modals / dialogs', category: 'system' },
  { keys: 'Ctrl + Shift + A', description: 'Add new task (quick add)', category: 'tasks' },
  { keys: 'Ctrl + Shift + L', description: 'Add new list', category: 'tasks' },
  { keys: 'Ctrl + Shift + K', description: 'Add new label', category: 'tasks' },
  { keys: 'Ctrl + C', description: 'Toggle task completion', category: 'tasks' },
  { keys: 'Ctrl + Enter', description: 'Save task (in forms)', category: 'forms' },
  { keys: 'Ctrl + Shift + C', description: 'Copy markdown export', category: 'forms' },
  { keys: 'Ctrl + Shift + E', description: 'Export backup', category: 'forms' },
  { keys: 'Ctrl + Shift + I', description: 'Import backup', category: 'forms' },
  { keys: 'T', description: 'Start/stop timer (in task details)', category: 'tasks' },
  { keys: 'Tab', description: 'Navigate between elements', category: 'navigation' },
  { keys: 'Shift + Tab', description: 'Navigate backwards', category: 'navigation' },
  { keys: '↑ / ↓', description: 'Navigate task list', category: 'navigation' },
  { keys: 'Enter', description: 'Open task details / submit forms', category: 'forms' },
  { keys: 'Space', description: 'Toggle checkbox / activate buttons', category: 'navigation' },
];

const categoryLabels: Record<string, string> = {
  navigation: 'Navigation',
  tasks: 'Tasks',
  forms: 'Forms',
  system: 'System',
};

function KeyBadge({ keys }: { keys: string }) {
  const keyParts = keys.split(' + ');
  return (
    <div className="flex items-center gap-1">
      {keyParts.map((key, i) => (
        <kbd
          key={i}
          className="px-2 py-1 text-xs font-mono bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded border border-gray-300 dark:border-gray-600 shadow-sm min-w-[24px] text-center"
        >
          {key === 'Ctrl' && <Command className="h-3 w-3" />}
          {key === '?' && '?'}
          {key === 'Escape' && 'Esc'}
          {key === 'Tab' && 'Tab'}
          {key === 'Shift' && 'Shift'}
          {key === 'Enter' && '⏎'}
          {key === 'Space' && 'Sp'}
          {key === '↑' && '↑'}
          {key === '↓' && '↓'}
          {!['Ctrl', '?', 'Escape', 'Tab', 'Shift', 'Enter', 'Space', '↑', '↓'].includes(key) && key}
        </kbd>
      ))}
    </div>
  );
}

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredShortcuts = searchQuery
    ? shortcuts.filter(s =>
        s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.keys.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shortcuts;

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    (acc[shortcut.category] as Shortcut[]).push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label="Keyboard shortcuts"
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </DialogTitle>
              <Button variant="ghost" size="icon" aria-label="Close" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            {Object.entries(groupedShortcuts).map(([category, items]) => (
              <div key={category} className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </h3>
                <div className="space-y-1">
                  {items.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-2 border-b border-muted/50 last:border-0 rounded hover:bg-muted/30 transition-colors"
                    >
                      <KeyBadge keys={shortcut.keys} />
                      <span className="text-sm text-muted-foreground flex-1 text-left ml-3">{shortcut.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {filteredShortcuts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No shortcuts found</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="mt-2 p-0"
                >
                  Clear search
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(
                  shortcuts.map(s => `${s.keys} - ${s.description}`).join('\n')
                );
              }}
              className="w-full"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy to Clipboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}