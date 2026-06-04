'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { api } from '@/lib/api';

const INTEREST_OPTIONS = [
  '遛狗', '貓咪', '咖啡', '旅行', '料理', '閱讀', '健身', '瑜伽',
  '攝影', '音樂', '電影', '設計', '程式', '登山', '游泳', '手作',
  '美食', '藝術', '烘焙', '戶外', '動漫', '語言',
];

const ZODIAC_OPTIONS = [
  '牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座',
  '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座',
];

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2].map((s) => (
        <div key={s} className={`rounded-full transition-all ${s === step ? 'bg-white w-4 h-1.5' : s < step ? 'bg-zinc-400 w-1.5 h-1.5' : 'bg-zinc-700 w-1.5 h-1.5'}`} />
      ))}
    </div>
  );
}

function Chip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full px-3 py-1.5 text-[13px] font-medium border transition-colors ${selected ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-400 bg-zinc-900 hover:border-zinc-500'}`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Step 2
  const [interests, setInterests] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [height, setHeight] = useState('');
  const [zodiac, setZodiac] = useState('');

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : prev.length < 10 ? [...prev, item] : prev,
    );
  }

  async function finish() {
    if (loading) return;
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {};
      if (displayName.trim()) payload.displayName = displayName.trim();
      if (bio.trim()) payload.bio = bio.trim();
      if (interests.length > 0) payload.interests = interests;
      if (jobTitle.trim()) payload.jobTitle = jobTitle.trim();
      if (height && !isNaN(Number(height))) payload.height = Number(height);
      if (zodiac) payload.zodiac = zodiac;
      if (Object.keys(payload).length > 0) await api.patch('/users/me', payload);
    } catch {}
    router.push('/swipe');
  }

  return (
    <main className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 max-w-sm mx-auto w-full">
        <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-1 -ml-1 text-zinc-400 hover:text-white">
          <ChevronLeft size={18} />
        </button>
        <StepDots step={step} />
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 max-w-sm mx-auto w-full">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="mt-4 space-y-6">
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 01 · 基本介紹</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">你想讓大家<br />怎麼認識你？</h1>
              <p className="mt-1.5 text-[13px] text-zinc-500">這些資料會顯示在你的配對卡上</p>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">顯示名稱</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="例如：小薇、阿明、Cathy..."
                maxLength={30}
                className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 text-sm border border-zinc-800 outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">個人簡介</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="分享你的故事、個性、或是你和毛孩的日常..."
                maxLength={300}
                rows={4}
                className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 text-sm border border-zinc-800 outline-none focus:border-zinc-600 placeholder:text-zinc-600 resize-none"
              />
              <p className="text-right text-[11px] text-zinc-600">{bio.length}/300</p>
            </div>

            <button
              onClick={() => { if (displayName.trim()) setStep(2); }}
              disabled={!displayName.trim()}
              className="w-full rounded-2xl py-3.5 bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:bg-zinc-900 disabled:text-zinc-600 disabled:border disabled:border-zinc-800"
            >
              繼續
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="mt-4 space-y-6 pb-10">
            <div>
              <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 02 · 興趣 & 資訊</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">讓大家更了解你</h1>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">興趣（最多 10 個）</label>
                <span className="font-mono text-[10px] text-zinc-500">{interests.length}/10</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item) => (
                  <Chip key={item} label={item} selected={interests.includes(item)} onToggle={() => toggleInterest(item)} />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">職稱</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="例如：軟體工程師、設計師..."
                maxLength={50}
                className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 text-sm border border-zinc-800 outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">身高（cm）</label>
              <input
                value={height}
                onChange={(e) => setHeight(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="例如：170"
                maxLength={3}
                className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 text-sm border border-zinc-800 outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
            </div>

            <div className="space-y-2.5">
              <label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">星座</label>
              <div className="flex flex-wrap gap-2">
                {ZODIAC_OPTIONS.map((z) => (
                  <Chip key={z} label={z} selected={zodiac === z} onToggle={() => setZodiac(zodiac === z ? '' : z)} />
                ))}
              </div>
            </div>

            <button
              onClick={finish}
              disabled={loading}
              className="w-full rounded-2xl py-3.5 bg-white text-black text-sm font-semibold hover:bg-zinc-100 transition-colors disabled:bg-zinc-800 disabled:text-zinc-500 flex items-center justify-center gap-2"
            >
              {loading ? '儲存中…' : '進入毛孩世界'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
