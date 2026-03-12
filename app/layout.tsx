import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';
import ThemeToggle from '@/components/theme/ThemeToggle';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Todo Planner',
  description: 'A modern daily task planner',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-background duration-200">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Daily Planner</h1>
            <ThemeToggle />
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
