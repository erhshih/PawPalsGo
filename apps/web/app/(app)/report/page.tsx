'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ReportReason } from '@pawpals/shared';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: '騷擾或霸凌' },
  { value: 'FAKE_PROFILE', label: '假帳號 / 冒充他人' },
  { value: 'INAPPROPRIATE_CONTENT', label: '不當內容' },
  { value: 'SCAM', label: '詐騙' },
  { value: 'SPAM', label: '垃圾訊息' },
  { value: 'OTHER', label: '其他' },
];

function ReportForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetId = searchParams.get('targetId') ?? '';
  const postId = searchParams.get('postId') ?? undefined;

  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!targetId) { toast.error('缺少檢舉對象'); return; }
    if (!reason) { toast.error('請選擇檢舉原因'); return; }
    setSubmitting(true);
    try {
      await api.post('/reports', { targetId, reason, detail: detail.trim() || undefined, postId });
      alert('已送出檢舉，我們會盡快審核，感謝你協助維護社群安全。');
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(msg === 'CANNOT_REPORT_SELF' ? '無法檢舉自己' : '送出失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">檢舉</span>
        <button onClick={submit} disabled={submitting} className="text-sm font-semibold text-white disabled:text-zinc-600 px-1.5">
          {submitting ? '送出中…' : '送出'}
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2.5">檢舉原因</p>
        <div className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <button
              key={r.value}
              onClick={() => setReason(r.value)}
              className={`text-left rounded-xl px-4 py-3.5 text-sm border transition-colors ${
                reason === r.value ? 'bg-white text-black border-white font-semibold' : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-6 mb-2.5">補充說明（選填）</p>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value.slice(0, 500))}
          placeholder="請描述發生的狀況..."
          rows={5}
          className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none placeholder:text-zinc-600 border border-zinc-800"
        />
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportForm />
    </Suspense>
  );
}
