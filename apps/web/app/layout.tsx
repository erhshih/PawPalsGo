import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PawPals Go',
  description: '找到你的毛孩靈魂伴侶',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-black text-white antialiased flex items-center justify-center">
        <div className="relative w-full max-w-sm h-[80vh] bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl flex flex-col">
          {children}
        </div>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  );
}
