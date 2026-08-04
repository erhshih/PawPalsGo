'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { BlockedEntryDto } from '@pawpals/shared';
import { ChevronLeft, User, Ban } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function BlockedListPage() {
  const router = useRouter();
  const [items, setItems] = useState<BlockedEntryDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<BlockedEntryDto[]>('/blocks').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  async function unblock(userId: string, name: string) {
    if (!confirm(`確定要解除封鎖「${name}」嗎？`)) return;
    try {
      await api.delete(`/blocks/${userId}`);
      setItems((prev) => prev.filter((i) => i.user.id !== userId));
      toast.success('已解除封鎖');
    } catch { toast.error('操作失敗，請稍後再試'); }
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">封鎖名單</span>
      </div>

      <div className="flex flex-col">
        {items.map((item) => {
          const avatarUri = toPhotoUri(item.user.avatarUrl);
          return (
            <div key={item.user.id} className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60">
              {avatarUri ? (
                <img src={avatarUri} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <User size={18} className="text-zinc-600" />
                </div>
              )}
              <span className="flex-1 text-sm text-white">{item.user.displayName || '使用者'}</span>
              <button
                onClick={() => unblock(item.user.id, item.user.displayName || '此使用者')}
                className="rounded-full bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                解除封鎖
              </button>
            </div>
          );
        })}
      </div>

      {loaded && items.length === 0 && (
        <div className="flex flex-col items-center pt-20 text-center">
          <Ban size={26} className="text-zinc-700" />
          <p className="text-zinc-500 text-sm mt-2.5">還沒有封鎖任何人</p>
        </div>
      )}
    </div>
  );
}
