import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';

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
        {children}
      </body>
    </html>
  );
}
