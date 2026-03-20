import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TaskFlow — Task Manager',
  description: 'Manage your tasks efficiently with TaskFlow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* ErrorBoundary wraps the entire app — any unhandled crash shows
            a friendly "Something went wrong" screen instead of a white page */}
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        {/* Toast notifications — positioned top-right, auto-dismiss after 4s */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
            error:   { style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
          }}
        />
      </body>
    </html>
  );
}
