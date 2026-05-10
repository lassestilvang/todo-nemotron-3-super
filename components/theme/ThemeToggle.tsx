'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot
} from '@/components/ui/dropdown-menu';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme') {
        setTheme(e.newValue as 'light' | 'dark' | 'system');
      }
    };

    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (storedTheme) {
      setTheme(storedTheme);
    }

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const resolved = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;

    setEffectiveTheme(resolved);
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    localStorage.setItem('theme', theme);

    const handleChange = () => {
      const newResolved = theme === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : theme;
      setEffectiveTheme(newResolved);
      root.classList.remove('light', 'dark');
      root.classList.add(newResolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

    return (
      <DropdownMenuRoot>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Theme settings">
            {effectiveTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
       <DropdownMenuContent align="end" sideOffset={4}>
         <DropdownMenuItem onClick={() => setTheme('system')}>
           System
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme('light')}>
           Light
         </DropdownMenuItem>
         <DropdownMenuItem onClick={() => setTheme('dark')}>
           Dark
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenuRoot>
   );
}
