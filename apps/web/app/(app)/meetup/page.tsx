'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { DogMeetupDto } from '@pawpals/shared';
import { ChevronLeft, Plus, MapPin, Users, Clock } from 'lucide-react';

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function distLabel(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function MeetupCard({ meetup }: { meetup: DogMeetupDto }) {
  const full = !!meetup.maxAttendees && meetup.attendeeCount >= meetup.maxAttendees;
  return (
    <Link
      href={`/meetup/${meetup.id}`}
      className="block rounded-2xl bg-zinc-900 border border-zinc-800 p-4 hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-white text-base font-bold flex-1">{meetup.title}</p>
        {full && <span className="shrink-0 rounded-full bg-zinc-800 text-zinc-400 text-[10px] px-2 py-1">已額滿</span>}
      </div>
      <div className="flex items-center gap-1.5 mt-2.5 text-zinc-400 text-xs">
        <Clock size={12} /> {fmt(meetup.scheduledAt)}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 text-zinc-400 text-xs">
        <MapPin size={12} /> {meetup.location}{distLabel(meetup.distanceM) ? ` · ${distLabel(meetup.distanceM)}` : ''}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 text-zinc-400 text-xs">
        <Users size={12} /> {meetup.attendeeCount}{meetup.maxAttendees ? ` / ${meetup.maxAttendees}` : ''} 人參加
      </div>
    </Link>
  );
}

export default function MeetupListPage() {
  const router = useRouter();
  const [meetups, setMeetups] = useState<DogMeetupDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<DogMeetupDto[]>('/dog-meetups/nearby', { params: { radius: 50, limit: 30 } })
      .then(({ data }) => setMeetups(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">狗聚</span>
        <button
          onClick={() => router.push('/meetup/create')}
          className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-zinc-100 transition-colors"
        >
          <Plus size={16} className="text-black" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {meetups.map((m) => <MeetupCard key={m.id} meetup={m} />)}
      </div>

      {loaded && meetups.length === 0 && (
        <div className="flex flex-col items-center pt-24 text-center">
          <p className="text-zinc-500 text-sm">附近還沒有狗聚活動</p>
          <p className="text-zinc-600 text-xs mt-1.5">發起一場，約大家出來遛狗吧！</p>
        </div>
      )}
    </div>
  );
}
