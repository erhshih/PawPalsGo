'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DogMeetupDto } from '@pawpals/shared';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const DAY_OPTIONS = [
  { label: '明天', days: 1 },
  { label: '後天', days: 2 },
  { label: '3 天後', days: 3 },
  { label: '一週後', days: 7 },
];
const HOUR_OPTIONS = [9, 12, 15, 18, 20];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2.5">{label}</p>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm border transition-colors ${
        active ? 'bg-white text-black border-white font-semibold' : 'bg-zinc-900 text-zinc-200 border-zinc-800 hover:border-zinc-600'
      }`}
    >
      {label}
    </button>
  );
}

export default function CreateMeetupPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [hour, setHour] = useState(18);
  const [maxAttendees, setMaxAttendees] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim() || !location.trim()) { toast.error('請填寫標題與地點'); return; }
    setSubmitting(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => { latitude = pos.coords.latitude; longitude = pos.coords.longitude; resolve(); },
            () => resolve(),
            { timeout: 8000 },
          );
        });
      }

      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + DAY_OPTIONS[dayIdx].days);
      scheduled.setHours(hour, 0, 0, 0);

      const { data } = await api.post<DogMeetupDto>('/dog-meetups', {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        latitude,
        longitude,
        scheduledAt: scheduled.toISOString(),
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      });
      router.replace(`/meetup/${data.id}`);
    } catch {
      toast.error('建立失敗，請稍後再試');
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
        <span className="text-base font-semibold text-white">發起狗聚</span>
        <button onClick={submit} disabled={submitting} className="text-sm font-semibold text-white disabled:text-zinc-600 px-1.5">
          {submitting ? '發布中…' : '發布'}
        </button>
      </div>

      <div className="p-4">
        <Field label="活動標題">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="例如：週末河濱公園狗聚"
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder:text-zinc-600 border border-zinc-800"
          />
        </Field>

        <Field label="活動說明（選填）">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 300))}
            placeholder="想約什麼樣的狗聚呢？"
            rows={3}
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none placeholder:text-zinc-600 border border-zinc-800"
          />
        </Field>

        <Field label="集合地點">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value.slice(0, 100))}
            placeholder="例如：大安森林公園"
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder:text-zinc-600 border border-zinc-800"
          />
        </Field>

        <Field label="日期">
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((opt, i) => (
              <Chip key={opt.label} label={opt.label} active={dayIdx === i} onClick={() => setDayIdx(i)} />
            ))}
          </div>
        </Field>

        <Field label="時間">
          <div className="flex flex-wrap gap-2">
            {HOUR_OPTIONS.map((h) => (
              <Chip key={h} label={`${h}:00`} active={hour === h} onClick={() => setHour(h)} />
            ))}
          </div>
        </Field>

        <Field label="人數上限">
          <input
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="10"
            className="w-24 bg-zinc-900 rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder:text-zinc-600 border border-zinc-800"
          />
        </Field>
      </div>
    </div>
  );
}
