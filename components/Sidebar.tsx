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

const views = [
  { name: 'Today', icon: Calendar, count: 0 },
  { name: 'Next 7 Days', icon: CalendarCheck, count: 0 },
  { name: 'Upcoming', icon: CalendarPlus, count: 0 },
  { name: 'All', icon: List, count: 0 },
];

const defaultLists = [
  { id: 'inbox', name: 'Inbox', icon: Inbox, color: 'bg-blue-500', emoji: '📥' },
];

const defaultLabels = [
  { id: 'work', name: 'Work', icon: Briefcase, color: 'bg-green-500', emoji: '💼' },
  { id: 'personal', name: 'Personal', icon: User, color: 'bg-purple-500', emoji: '👤' },
];

export default function Sidebar() {
  const [lists, setLists] = useState(defaultLists);
  const [labels, setLabels] = useState(defaultLabels);
  const [selectedView, setSelectedView] = useState('Today');
  const [newListName, setNewListName] = useState('');
  const [newLabelName, setNewLabelName] = useState('');

  const addList = () => {
    if (newListName.trim()) {
      const newList = {
        id: `list_${Date.now()}`,
        name: newListName,
        icon: Circle, // default icon
        color: 'bg-gray-500', // default color
        emoji: '🔲', // default emoji
      };
      setLists([...lists, newList]);
      setNewListName('');
    }
  };

  const addLabel = () => {
    if (newLabelName.trim()) {
      const newLabel = {
        id: `label_${Date.now()}`,
        name: newLabelName,
        icon: Tag, // default icon
        color: 'bg-gray-500', // default color
        emoji: '🏷️', // default emoji
      };
      setLabels([...labels, newLabel]);
      setNewLabelName('');
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
              {views.map((view) => (
                <Button
                  key={view.name}
                  variant={selectedView === view.name ? 'outline' : 'default'}
                  className="w-full text-left justify-start px-3 py-2"
                  onClick={() => setSelectedView(view.name)}
                >
                  <span className="flex items-center gap-3">
                    <view.icon className="h-5 w-5" />
                    <span>{view.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{view.count}</span>
                  </span>
                </Button>
              ))}
            </CardContent>
          </Card>

           {/* Lists */}
           <Card className="mb-4">
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-semibold">Lists</CardTitle>
               </div>
              </CardHeader>
             <CardContent className="space-y-2">
               {/* Inbox (always first) */}
               <Button
                 variant={lists.find((l) => l.id === 'inbox') ? 'outline' : 'default'}
                 className="w-full text-left justify-start px-3 py-2"
                 onClick={() => {}}
               >
                 <span className="flex items-center gap-3">
                   <Inbox className="h-4 w-4" />
                   <span className="font-medium">Inbox</span>
                 </span>
               </Button>
               {/* Add other lists here */}
                {lists.map((list) => (
                  <Button
                    key={list.id}
                    variant="default"
                    className="w-full text-left justify-start px-3 py-2"
                    onClick={() => {}}
                  >
                    <List className="h-4 w-4" />
                    <span className="flex-1">{list.name}</span>
                  </Button>
                ))}
                <div className="flex space-x-2">
                  <Input
                    placeholder="List name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') addList();
                    }}
                  />
                  <Button onClick={addList} size="icon" aria-label="Add list">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
           </Card>

           {/* Labels */}
           <Card>
             <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-semibold">Labels</CardTitle>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" aria-label="Add label">
                         <Plus className="h-4 w-4" />
                       </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" sideOffset={4}>
                       <DropdownMenuItem onClick={() => setNewLabelName('')}>
                         New label
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
               </div>
             </CardHeader>
            <CardContent className="space-y-2">
              {labels.map((label) => (
                <Button
                  key={label.id}
                  variant="default"
                  className="w-full text-left justify-start px-3 py-2"
                  onClick={() => {}}
                >
                  <span className="flex items-center gap-3">
                    <span className={`${label.color} h-5 w-5 flex items-center justify-center rounded`}>
                      {label.emoji}
                    </span>
                    <span>{label.name}</span>
                  </span>
                </Button>
              ))}
              {/* Add label input */}
              <div className="flex space-x-2">
                <Input
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') addLabel();
                  }}
                />
                <Button onClick={addLabel} size="icon" aria-label="Add label">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </MotionWrapper>
  );
}
