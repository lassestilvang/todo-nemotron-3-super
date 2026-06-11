import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import { AppProvider } from '@/lib/app-context';
import { CommandPalette } from '@/components/CommandPalette';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Todo Planner - Daily Task Manager',
  description: 'A modern daily task planner with drag-and-drop, subtasks, labels, and keyboard shortcuts',
  keywords: ['todo', 'planner', 'tasks', 'productivity', 'organizer'],
  authors: [{ name: 'Todo Planner Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-background duration-200">
        <AppProvider>
          <Sidebar />
          {children}
          <CommandPalette />
        </AppProvider>
      </body>
    </html>
  );
}
