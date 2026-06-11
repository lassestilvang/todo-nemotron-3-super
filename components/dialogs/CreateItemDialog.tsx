'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
  'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
  'bg-rose-500', 'bg-slate-500', 'bg-gray-500', 'bg-zinc-500',
];

const EMOJIS = ['📥', '📋', '📝', '✅', '📌', '🏷️', '💼', '🏠', '🎯', '📚', '🛒', '💡', '⚡', '🎨', '🎮', '🎵'];

interface CreateItemDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  type: 'list' | 'label';
  onSubmit: (name: string, color: string, emoji: string) => Promise<void>;
}

export default function CreateItemDialog({
  isOpen,
  onOpenChange,
  title,
  type,
  onSubmit,
}: CreateItemDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  const [emoji, setEmoji] = useState(type === 'list' ? '📋' : '🏷️');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setColor('bg-blue-500');
      setEmoji(type === 'list' ? '📋' : '🏷️');
    }
  }, [isOpen, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(name.trim(), color, emoji);
      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to create ${type}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Enter ${type} name`}
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Color</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <div className={`h-4 w-4 rounded-full ${color}`} />
                    <span>Select Color</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`h-6 w-6 rounded-full ${c} ${
                          color === c ? 'ring-2 ring-primary ring-offset-2' : ''
                        }`}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2 text-lg">
                    <span>{emoji}</span>
                    <span className="text-sm">Select Emoji</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="p-2">
                  <div className="grid grid-cols-4 gap-1">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`h-10 w-10 text-xl flex items-center justify-center rounded-md hover:bg-accent ${
                          emoji === e ? 'bg-accent' : ''
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? 'Creating...' : `Create ${type}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
