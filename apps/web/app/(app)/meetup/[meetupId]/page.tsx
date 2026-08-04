'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { DogMeetupDto } from '@pawpals/shared';
import { ChevronLeft, MapPin, Clock, Users, User, Ban } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MeetupDetailPage() {
  const { meetupId } = useParams<{ meetupId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const [meetup, setMeetup] = useState<DogMeetupDto | null>(null);

  function load() {
    api.get<DogMeetupDto>(`/dog-meetups/${meetupId}`).then(({ data }) => setMeetup(data)).catch(() => {});
  }

  useEffect(() => { if (meetupId) load(); }, [meetupId]);

  if (!meetup) return null;

  const isOrganizer = meetup.organizerId === userId;
  const joined = meetup.attendees?.some((a) => a.userId === userId) ?? false;
  const cancelled = !!meetup.cancelledAt;
  const full = !!meetup.maxAttendees && meetup.attendeeCount >= meetup.maxAttendees;

  async function join() {
    try {
      await api.post(`/dog-meetups/${meetupId}/join`, {});
      toast.success('已報名參加！');
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(msg === 'MEETUP_FULL' ? '名額已滿' : '報名失敗，請稍後再試');
    }
  }

  async function leave() {
    if (!confirm('確定要退出這場狗聚嗎？')) return;
    try { await api.delete(`/dog-meetups/${meetupId}/leave`); load(); } catch { toast.error('操作失敗，請稍後再試'); }
  }

  async function cancelMeetup() {
    if (!confirm('確定要取消這場狗聚嗎？所有參加者都會看到已取消。')) return;
    try { await api.delete(`/dog-meetups/${meetupId}`); load(); } catch { toast.error('操作失敗，請稍後再試'); }
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">狗聚詳情</span>
      </div>

      <div className="p-4">
        {cancelled && (
          <div className="rounded-xl bg-red-950/40 border border-red-900/40 p-3 mb-4 flex items-center gap-2">
            <Ban size={16} className="text-red-500" />
            <span className="text-sm font-semibold text-red-500">此狗聚已被取消</span>
          </div>
        )}

        <h1 className="text-2xl font-bold text-white">{meetup.title}</h1>
        {meetup.description && <p className="text-sm text-zinc-400 leading-relaxed mt-2.5">{meetup.description}</p>}

        <div className="mt-5 flex flex-col gap-3">
          <div className="flex items-center gap-2.5 text-zinc-200 text-sm">
            <Clock size={16} className="text-zinc-500" /> {fmt(meetup.scheduledAt)}
          </div>
          <div className="flex items-center gap-2.5 text-zinc-200 text-sm">
            <MapPin size={16} className="text-zinc-500" /> {meetup.location}
          </div>
          <div className="flex items-center gap-2.5 text-zinc-200 text-sm">
            <Users size={16} className="text-zinc-500" /> {meetup.attendeeCount}{meetup.maxAttendees ? ` / ${meetup.maxAttendees}` : ''} 人參加
          </div>
        </div>

        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mt-6 mb-2.5">參加者</p>
        <div className="flex flex-col gap-2.5">
          {(meetup.attendees ?? []).map((a) => {
            const avatarUri = toPhotoUri(a.user?.avatarUrl);
            return (
              <div key={a.id} className="flex items-center gap-2.5">
                {avatarUri ? (
                  <img src={avatarUri} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <User size={14} className="text-zinc-600" />
                  </div>
                )}
                <span className="text-sm text-zinc-200">
                  {a.user?.displayName || '毛孩爸媽'}{a.userId === meetup.organizerId ? '（發起人）' : ''}
                </span>
                {a.pet && <span className="text-xs text-zinc-500">· 帶 {a.pet.name}</span>}
              </div>
            );
          })}
        </div>

        {!cancelled && (
          <div className="mt-7">
            {isOrganizer ? (
              <button onClick={cancelMeetup} className="w-full rounded-xl bg-zinc-900 border border-red-900/40 py-3.5 text-red-500 text-sm font-semibold hover:bg-zinc-800 transition-colors">
                取消狗聚
              </button>
            ) : joined ? (
              <button onClick={leave} className="w-full rounded-xl bg-zinc-900 border border-zinc-800 py-3.5 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 transition-colors">
                退出狗聚
              </button>
            ) : (
              <button
                onClick={join}
                disabled={full}
                className="w-full rounded-xl bg-white py-3.5 text-black text-sm font-bold hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors"
              >
                {full ? '名額已滿' : '報名參加'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
