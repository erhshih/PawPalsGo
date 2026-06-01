'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { useUnreadStore } from '@/stores/unread';
import { Heart, MessageCircle, User } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { accessToken, loadFromStorage } = useAuthStore();
  const { perMatch } = useUnreadStore();
  const [ready, setReady] = useState(false);

  const totalUnread = Object.values(perMatch).reduce((s, n) => s + n, 0);

  useEffect(() => {
    loadFromStorage();
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && !accessToken) router.push('/login');
  }, [ready, accessToken]);

  const isChatDetail = pathname.startsWith('/chat/');

  if (!ready || !accessToken) return null;

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">{children}</main>
      {!isChatDetail && (
        <nav className="shrink-0 border-t border-zinc-800 bg-zinc-950">
          <div className="flex">
            {[
              { href: '/swipe', icon: Heart, label: '探索' },
              { href: '/chat', icon: MessageCircle, label: '訊息' },
              { href: '/profile', icon: User, label: '我的' },
            ].map(({ href, icon: Icon, label }) => {
              const active = pathname === href;
              const isChat = href === '/chat';
              return (
                <Link key={href} href={href} className="flex-1 flex flex-col items-center py-3 gap-1 relative">
                  <div className="relative">
                    <Icon size={20} className={active ? 'text-white' : 'text-zinc-600'} />
                    {isChat && totalUnread > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center px-1">
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </span>
                    )}
                  </div>
                  <span className={`font-mono text-[9px] tracking-widest ${active ? 'text-white' : 'text-zinc-600'}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
