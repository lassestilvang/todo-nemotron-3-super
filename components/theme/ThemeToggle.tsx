'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ThemeToggle() {
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 dark:-rotate-90 dark:scale-0 transition-transform" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-transform" />
    </Button>
  );
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
      <DropdownMenu>
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
      </DropdownMenu>
   );
}
