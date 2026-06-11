'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Trash2, 
  X, 
  MoreHorizontal,
  Circle,
  GripHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface FloatingActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onMarkComplete: (complete: boolean) => void;
  onDelete: () => void;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
}

export function FloatingActionBar({
  selectedCount,
  onClear,
  onMarkComplete,
  onDelete,
  isAllSelected,
  onToggleSelectAll,
}: FloatingActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, x: '-50%' }}
        animate={{ y: 0, opacity: 1, x: '-50%' }}
        exit={{ y: 100, opacity: 0, x: '-50%' }}
        className="fixed bottom-12 left-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-full shadow-2xl ring-1 ring-white/10 dark:ring-black/10"
      >
        <div className="flex items-center gap-3 pr-4 border-r border-white/20 dark:border-black/20">
          <Checkbox 
            checked={isAllSelected}
            onCheckedChange={onToggleSelectAll}
            className="border-white/50 dark:border-black/50 data-[state=checked]:bg-white dark:data-[state=checked]:bg-black data-[state=checked]:text-black dark:data-[state=checked]:text-white"
          />
          <span className="text-sm font-bold whitespace-nowrap">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center gap-1">
          <ActionButton onClick={() => onMarkComplete(true)} icon={<CheckCircle2 className="h-4 w-4" />} label="Done" />
          <ActionButton onClick={() => onMarkComplete(false)} icon={<Circle className="h-4 w-4" />} label="Pending" />
          <ActionButton onClick={onDelete} icon={<Trash2 className="h-4 w-4 text-red-400 dark:text-red-600" />} label="Delete" variant="destructive" />
        </div>

        <button 
          onClick={onClear}
          className="ml-2 p-1 rounded-full hover:bg-white/10 dark:hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function ActionButton({ 
  onClick, 
  icon, 
  label, 
  variant = 'default' 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  variant?: 'default' | 'destructive'
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all hover:bg-white/10 dark:hover:bg-black/10 ${variant === 'destructive' ? 'text-red-400 dark:text-red-600' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
