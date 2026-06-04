'use client';

import { useState } from 'react';
import {
  Plus,
  Calendar,
  CalendarCheck,
  CalendarPlus,
  List,
  Briefcase,
  User,
  Tag,
  Circle,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
   DropdownMenu, 
   DropdownMenuContent, 
   DropdownMenuItem, 
   DropdownMenuTrigger 
 } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { MotionWrapper, slideInLeft } from '@/components/animations/motion-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/lib/app-context';

const viewOptions = [
  { name: 'Today', value: 'today', icon: Calendar },
  { name: 'Next 7 Days', value: 'next7', icon: CalendarCheck },
  { name: 'Upcoming', value: 'upcoming', icon: CalendarPlus },
  { name: 'All', value: 'all', icon: List },
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
    addList,
    addLabel,
    refreshLists,
    refreshLabels,
  } = useApp();

  const [newListName, setNewListName] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newListColor, setNewListColor] = useState('bg-gray-500');
  const [newListEmoji, setNewListEmoji] = useState('🔲');
  const [newLabelColor, setNewLabelColor] = useState('bg-gray-500');
  const [newLabelEmoji, setNewLabelEmoji] = useState('🏷️');

  const colors = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500',
    'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500',
    'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500',
    'bg-rose-500', 'bg-slate-500', 'bg-gray-500', 'bg-zinc-500',
  ];

  const emojis = ['📥', '📋', '📝', '✅', '📌', '🏷️', '💼', '🏠', '🎯', '📚', '🛒', '💡', '⚡', '🎨', '🎮', '🎵'];

  const handleAddList = async () => {
    if (newListName.trim()) {
      try {
        await addList(newListName.trim(), newListColor, newListEmoji);
        setNewListName('');
        setNewListColor('bg-gray-500');
        setNewListEmoji('🔲');
      } catch (error) {
        console.error('Failed to add list:', error);
      }
    }
  };

  const handleAddLabel = async () => {
    if (newLabelName.trim()) {
      try {
        await addLabel(newLabelName.trim(), newLabelColor, newLabelEmoji);
        setNewLabelName('');
        setNewLabelColor('bg-gray-500');
        setNewLabelEmoji('🏷️');
      } catch (error) {
        console.error('Failed to add label:', error);
      }
    }
  };

  return (
    <MotionWrapper 
      variants={slideInLeft()} 
      initial={false} 
      animate={true}
      className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen"
    >
      <div className="flex-1 overflow-y-auto p-4">
        {/* Views */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Views</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {viewOptions.map((view) => (
              <Button
                key={view.value}
                variant={activeView === view.value ? 'outline' : 'default'}
                className="w-full text-left justify-start px-3 py-2"
                onClick={() => setActiveView(view.value as 'today' | 'next7' | 'upcoming' | 'all')}
              >
                <span className="flex items-center gap-3">
                  <view.icon className="h-5 w-5" />
                  <span>{view.name}</span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Lists */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Lists</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Inbox (always first) */}
            <Button
              variant={filterListId === null || filterListId === 'inbox' ? 'outline' : 'default'}
              className="w-full text-left justify-start px-3 py-2"
              onClick={() => setFilterListId(filterListId === 'inbox' ? null : 'inbox')}
            >
              <span className="flex items-center gap-3">
                <Inbox className="h-4 w-4" />
                <span className="font-medium">Inbox</span>
              </span>
            </Button>
            {listsLoading ? (
              <>
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2" />
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2" />
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              </>
            ) : (
              <>
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant={filterListId === list.id ? 'outline' : 'default'}
                    className="w-full text-left justify-start px-3 py-2"
                    onClick={() => setFilterListId(filterListId === list.id ? null : list.id)}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`${list.color} h-4 w-4 flex items-center justify-center rounded`}>
                        {list.emoji}
                      </span>
                      <span className="flex-1">{list.name}</span>
                    </span>
                  </Button>
                ))}
              </>
            )}
            <div className="flex space-x-2">
              <Input
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Select color">
                    <div className={`h-4 w-4 rounded ${newListColor}`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewListColor(color)}
                        className={`h-6 w-6 rounded ${color} ${newListColor === color ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Select emoji">
                    <span className="h-4 w-4 text-lg">{newListEmoji}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="p-2">
                  <div className="grid grid-cols-5 gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setNewListEmoji(emoji)}
                        className={`h-8 w-8 text-xl rounded ${newListEmoji === emoji ? 'ring-2 ring-offset-2 ring-offset-background bg-accent' : 'hover:bg-accent'}`}
                        aria-label={emoji}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddList} size="icon" aria-label="Add list">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Labels */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Labels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {labelsLoading ? (
              <>
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2" />
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse mb-2" />
                <div className="h-8 w-full rounded bg-gray-200 dark:bg-gray-600 animate-pulse" />
              </>
            ) : (
              <>
                {labels.map((label) => (
                  <Button
                    key={label.id}
                    variant={filterLabelId === label.id ? 'outline' : 'default'}
                    className="w-full text-left justify-start px-3 py-2"
                    onClick={() => setFilterLabelId(filterLabelId === label.id ? null : label.id)}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`${label.color} h-5 w-5 flex items-center justify-center rounded`}>
                        {label.emoji}
                      </span>
                      <span>{label.name}</span>
                    </span>
                  </Button>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="Label name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddLabel();
                    }}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Select color">
                        <div className={`h-4 w-4 rounded ${newLabelColor}`} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4} className="p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setNewLabelColor(color)}
                            className={`h-6 w-6 rounded ${color} ${newLabelColor === color ? 'ring-2 ring-offset-2 ring-offset-background' : ''}`}
                            aria-label={color}
                          />
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Select emoji">
                        <span className="h-4 w-4 text-lg">{newLabelEmoji}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={4} className="p-2">
                      <div className="grid grid-cols-5 gap-1">
                        {emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setNewLabelEmoji(emoji)}
                            className={`h-8 w-8 text-xl rounded ${newLabelEmoji === emoji ? 'ring-2 ring-offset-2 ring-offset-background bg-accent' : 'hover:bg-accent'}`}
                            aria-label={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={handleAddLabel} size="icon" aria-label="Add label">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MotionWrapper>
  );
}