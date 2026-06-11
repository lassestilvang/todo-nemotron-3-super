'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target, 
  Award, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { Task } from '@/types/task';

interface InsightsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
}

export default function InsightsDialog({
  isOpen,
  onOpenChange,
  tasks,
}: InsightsDialogProps) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = tasks.filter(t => t.priority === 'high').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  const totalEstimate = tasks.reduce((sum, t) => sum + (typeof t.estimate === 'number' ? t.estimate : 0), 0);
  const totalActual = tasks.reduce((sum, t) => sum + (t.actualTime || 0), 0);
  const efficiency = totalEstimate > 0 ? Math.round((totalEstimate / Math.max(totalActual, 1)) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none bg-white dark:bg-slate-950 shadow-2xl rounded-2xl">
        <div className="flex flex-col">
          <div className="px-8 pt-8 pb-6 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-900">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">Productivity Insights</DialogTitle>
            </div>
            <p className="text-sm text-slate-500">Analyze your performance and optimization opportunities.</p>
          </div>

          <div className="p-8 space-y-8">
            {/* Top Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Completion</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{completionRate}%</div>
                <div className="flex items-center gap-1 text-[10px] text-green-500 mt-1 font-bold">
                  <ArrowUpRight className="h-3 w-3" />
                  <span>+12% vs last week</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Efficiency</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{efficiency}%</div>
                <div className="flex items-center gap-1 text-[10px] text-amber-500 mt-1 font-bold">
                  <Activity className="h-3 w-3" />
                  <span>Optimal range</span>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">High Priority</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-slate-50">{highPriority}</div>
                <div className="flex items-center gap-1 text-[10px] text-red-500 mt-1 font-bold">
                  <Zap className="h-3 w-3" />
                  <span>Immediate action</span>
                </div>
              </div>
            </div>

            {/* Distribution */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Task Distribution
              </h3>
              <div className="space-y-3">
                <InsightProgress label="Completed" value={completed} total={total} color="bg-green-500" />
                <InsightProgress label="Pending" value={pending} total={total} color="bg-blue-500" />
                <InsightProgress label="High Priority" value={highPriority} total={total} color="bg-red-500" />
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
               <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Pro Recommendations
               </h3>
               <div className="space-y-4">
                  <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                        <Clock className="h-4 w-4 text-primary" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Optimize for Deep Work</p>
                        <p className="text-xs text-slate-500 mt-1">You complete 40% more tasks when Focus Mode is active for at least 30 minutes.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="h-8 w-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 shrink-0">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                     </div>
                     <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Morning Momentum</p>
                        <p className="text-xs text-slate-500 mt-1">Your completion rate is highest between 8 AM and 11 AM. Schedule high-priority tasks then.</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InsightProgress({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span>{label}</span>
        <span>{value} ({Math.round(percentage)}%)</span>
      </div>
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
