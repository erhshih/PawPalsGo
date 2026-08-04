'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RedemptionDto } from '@pawpals/shared';
import { ChevronLeft, Ticket } from 'lucide-react';

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RedemptionHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<RedemptionDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<RedemptionDto[]>('/redemptions/history').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">兌換紀錄</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">{item.reward?.partnerName}</p>
            <p className="text-white text-base font-bold mt-1">{item.reward?.title}</p>
            <div className="flex items-center gap-2 mt-3 bg-black rounded-lg p-3">
              <Ticket size={16} className="text-orange-500" />
              <span className="text-orange-500 text-base font-bold tracking-wider">{item.code}</span>
            </div>
            <p className="text-xs text-zinc-600 mt-2">兌換於 {fmt(item.redeemedAt)}</p>
          </div>
        ))}
      </div>

      {loaded && items.length === 0 && (
        <div className="flex flex-col items-center pt-20 text-center">
          <p className="text-zinc-500 text-sm">還沒有兌換紀錄</p>
        </div>
      )}
    </div>
  );
}
