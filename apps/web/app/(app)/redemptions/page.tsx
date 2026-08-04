'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useWalletStore } from '@/stores/wallet';
import { RedemptionRewardDto, RedemptionDto } from '@pawpals/shared';
import { ChevronLeft, Gift, History } from 'lucide-react';
import { toast } from 'sonner';

function RewardCard({ reward, balance, onRedeem }: { reward: RedemptionRewardDto; balance: number; onRedeem: () => void }) {
  const outOfStock = reward.stock != null && reward.stock <= 0;
  const affordable = balance >= reward.costJerky;
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">{reward.partnerName}</p>
      <p className="text-white text-base font-bold mt-1">{reward.title}</p>
      {reward.description && <p className="text-sm text-zinc-400 mt-1.5">{reward.description}</p>}
      <div className="flex items-center justify-between mt-3.5">
        <span className="text-orange-500 text-base font-bold">{reward.costJerky} 🦴</span>
        <button
          onClick={onRedeem}
          disabled={outOfStock || !affordable}
          className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${
            outOfStock || !affordable ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black hover:bg-zinc-100'
          }`}
        >
          {outOfStock ? '已兌完' : !affordable ? '肉乾不足' : '兌換'}
        </button>
      </div>
      {reward.stock != null && !outOfStock && <p className="text-xs text-zinc-600 mt-2">剩餘 {reward.stock} 份</p>}
    </div>
  );
}

export default function RedemptionsPage() {
  const router = useRouter();
  const { balance, deductBalance } = useWalletStore();
  const [rewards, setRewards] = useState<RedemptionRewardDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  function load() {
    api.get<RedemptionRewardDto[]>('/redemptions/rewards').then(({ data }) => setRewards(data)).catch(() => {}).finally(() => setLoaded(true));
  }

  useEffect(() => { load(); }, []);

  async function redeem(reward: RedemptionRewardDto) {
    if (!confirm(`使用 ${reward.costJerky} 塊肉乾兌換「${reward.title}」？`)) return;
    try {
      const { data } = await api.post<RedemptionDto>(`/redemptions/rewards/${reward.id}`);
      deductBalance(reward.costJerky);
      load();
      alert(`兌換成功！\n兌換碼：${data.code}\n請至合作品牌端出示此碼領取。`);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(msg === 'OUT_OF_STOCK' ? '已兌完' : msg === 'INSUFFICIENT_BALANCE' ? '肉乾不足' : '兌換失敗，請稍後再試');
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">肉乾兌換</span>
        <button onClick={() => router.push('/redemptions/history')} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <History size={18} />
        </button>
      </div>

      <p className="px-4 pt-4 text-xs text-zinc-500">
        目前肉乾餘額：<span className="text-orange-500 font-bold">{balance}</span>
      </p>

      <div className="flex flex-col gap-3 p-4">
        {rewards.map((r) => <RewardCard key={r.id} reward={r} balance={balance} onRedeem={() => redeem(r)} />)}
      </div>

      {loaded && rewards.length === 0 && (
        <div className="flex flex-col items-center pt-20 text-center">
          <Gift size={26} className="text-zinc-700" />
          <p className="text-zinc-500 text-sm mt-2.5">目前沒有可兌換的獎勵</p>
        </div>
      )}
    </div>
  );
}
