'use client';

import { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from '@/components/ui/dialog';
import { Keyboard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Shortcut {
  keys: string;
  description: string;
}

const shortcuts: Shortcut[] = [
  { keys: 'Ctrl + Shift + A', description: 'Add new task' },
  { keys: 'Ctrl + Shift + L', description: 'Add new list' },
  { keys: 'Ctrl + Shift + K', description: 'Add new label' },
  { keys: 'Ctrl + C', description: 'Toggle task completion' },
  { keys: 'Escape', description: 'Close modals / dialogs' },
  { keys: 'Ctrl + Enter', description: 'Save task (in forms)' },
  { keys: 'Tab', description: 'Navigate between elements' },
  { keys: 'Shift + Tab', description: 'Navigate backwards' },
  { keys: 'Enter', description: 'Open task details / submit forms' },
  { keys: 'Space', description: 'Toggle checkbox / activate buttons' },
  { keys: '↑ / ↓', description: 'Navigate task list' },
  { keys: '?', description: 'Show this help' },
];

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && e.shiftKey) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
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
        className="opacity-50 hover:opacity-100"
      >
        <Keyboard className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
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
          <div className="space-y-3 py-4">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-muted/50 last:border-0">
                <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border border-border mr-3">
                  {shortcut.keys}
                </kbd>
                <span className="text-sm text-muted-foreground flex-1 text-left">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}