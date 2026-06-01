'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useDiscoverPrefs } from '@/stores/discoverPrefs';

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];
const GENDER_OPTIONS = ['男性', '女性', '多元性別'];

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-zinc-500 tracking-widest uppercase px-4 pt-6 pb-2">{title}</p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">{children}</div>
  );
}

function FilterRow({ label, value, onClick, last }: {
  label: string; value?: string; onClick?: () => void; last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 hover:bg-zinc-800/60 transition-colors text-left ${!last ? 'border-b border-zinc-800' : ''}`}
    >
      <span className="text-sm text-zinc-200">{label}</span>
      <span className="text-sm text-zinc-500">{value ?? '選取'} ›</span>
    </button>
  );
}

export default function WebDiscoverSettingsPage() {
  const router = useRouter();
  const prefs = useDiscoverPrefs();
  const [radius, setRadius] = useState(prefs.radius);
  const [showMore, setShowMore] = useState(prefs.showMore);
  const [genderFilter, setGenderFilter] = useState<string[]>(prefs.genderFilter);
  const [roleFilter, setRoleFilter] = useState<'OWNER' | 'LOVER' | null>(prefs.roleFilter);

  function toggleGender(g: string) {
    setGenderFilter((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  }

  function save() {
    prefs.setRadius(radius);
    prefs.setShowMore(showMore);
    prefs.setGenderFilter(genderFilter);
    prefs.setRoleFilter(roleFilter);
    toast.success('探索設定已儲存');
    router.back();
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">探索設定</span>
        <button
          onClick={save}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <Check size={16} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* 對象篩選 */}
      <SectionHeader title="對象篩選" />
      <Card>
        <FilterRow label="興趣" onClick={() => toast.info('功能即將推出')} />
        <FilterRow label="星座" onClick={() => toast.info('功能即將推出')} />
        <FilterRow label="教育程度" onClick={() => toast.info('功能即將推出')} />
        <FilterRow label="飲酒習慣" onClick={() => toast.info('功能即將推出')} />
        <FilterRow label="寵物" onClick={() => toast.info('功能即將推出')} last />
      </Card>

      {/* DISCOVERY */}
      <SectionHeader title="DISCOVERY" />
      <Card>
        {/* Distance */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-zinc-200">最大距離</span>
            <span className="text-sm font-semibold text-white">{radius} km</span>
          </div>
          {/* Quick select */}
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((km) => (
              <button
                key={km}
                onClick={() => setRadius(km)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                  radius === km ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* Show more toggle */}
        <div className="px-4 py-4 flex items-center justify-between border-b border-zinc-800">
          <p className="text-sm text-zinc-200 flex-1 mr-4">在我滑完可瀏覽的檔案時，向我顯示還一點的交友檔案。</p>
          <button
            onClick={() => setShowMore(!showMore)}
            className={`w-12 h-6 rounded-full transition-colors ${showMore ? 'bg-orange-500' : 'bg-zinc-700'} relative shrink-0`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${showMore ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Gender filter */}
        <div className="px-4 py-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-200 mb-3">有興趣的對象</p>
          <div className="flex gap-2">
            {GENDER_OPTIONS.map((g) => {
              const sel = genderFilter.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => toggleGender(g)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    sel ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Role filter */}
        <div className="px-4 py-4">
          <p className="text-sm text-zinc-200 mb-3">身分篩選</p>
          <div className="flex gap-2">
            {([{ label: '全部', value: null }, { label: '飼主', value: 'OWNER' }, { label: '愛寵人', value: 'LOVER' }] as const).map(({ label, value }) => {
              const sel = roleFilter === value;
              return (
                <button
                  key={label}
                  onClick={() => setRoleFilter(value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    sel ? 'border-orange-500 bg-orange-500/10 text-orange-400' : 'border-zinc-700 text-zinc-500 hover:border-zinc-500'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
