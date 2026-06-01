'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth';
import { useUnreadStore } from '@/stores/unread';
import { MatchDto, MessageDto } from '@pawpals/shared';
import { MessageCircle, ChevronRight } from 'lucide-react';

export default function ChatPage() {
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const { userId: storeUserId, loadFromStorage } = useAuthStore();
  const { perMatch, setAll, increment } = useUnreadStore();
  useEffect(() => { loadFromStorage(); }, []);
  const userId = storeUserId ?? localStorage.getItem('user_id');

  useEffect(() => {
    api.get<MatchDto[]>('/matches')
      .then(({ data }) => {
        setMatches(data);
        setAll(data.map((m) => ({ matchId: m.id, count: m.unreadCount })));
      })
      .catch(() => {});
  }, []);

  // 加入所有配對房間，監聽新訊息即時更新列表
  useEffect(() => {
    if (matches.length === 0) return;

    const socket = connectSocket();
    matches.forEach((m) => socket.emit('chat:join', { matchId: m.id }));

    socket.on('chat:message', (msg: MessageDto) => {
      if (msg.senderId === userId) return;
      setMatches((prev) =>
        prev.map((m) => m.id === msg.matchId ? { ...m, lastMessage: msg } : m),
      );
      increment(msg.matchId);
    });

    return () => { socket.off('chat:message'); };
  }, [matches.length, userId]);

  return (
    <div className="max-w-lg mx-auto pt-6 px-4">
      <h1 className="text-lg font-semibold mb-6">訊息</h1>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <MessageCircle size={40} className="mb-3" />
          <p className="text-sm">還沒有配對訊息</p>
        </div>
      ) : (
        <div className="space-y-1">
          {matches.map((m) => {
            const unread = perMatch[m.id] ?? 0;
            return (
              <Link key={m.id} href={`/chat/${m.id}`}>
                <div className="flex items-center gap-4 px-3 py-4 rounded-xl hover:bg-zinc-900/60 cursor-pointer transition-colors border-b border-zinc-800/50">
                  <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-xl">
                    🐾
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{m.partner?.email ?? '配對對象'}</p>
                    {m.lastMessage && (
                      <p className="text-xs text-zinc-500 mt-0.5 truncate">{m.lastMessage.text}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <span className="h-5 w-5 rounded-full bg-white text-black text-[10px] font-semibold flex items-center justify-center">
                        {unread}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-zinc-600" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
