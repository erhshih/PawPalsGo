'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth';
import { useUnreadStore } from '@/stores/unread';
import { useWalletStore } from '@/stores/wallet';
import { MessageDto, MeetingDto } from '@pawpals/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, CheckCheck, Calendar, QrCode } from 'lucide-react';
import { toast } from 'sonner';

const HOURS = [10, 12, 14, 16, 18, 20];
const DAYS = [1, 2, 3, 4, 5, 6, 7];

export default function ChatDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDto | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(14);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { userId: storeUserId, loadFromStorage } = useAuthStore();
  const { clear: clearUnread } = useUnreadStore();
  const { balance, deductBalance } = useWalletStore();
  useEffect(() => { loadFromStorage(); }, []);
  const userId = storeUserId ?? localStorage.getItem('user_id');

  useEffect(() => {
    if (!matchId) return;

    api.get<MessageDto[]>(`/matches/${matchId}/messages`)
      .then(({ data }) => {
        setMessages(data.reverse());
        setHasMore(data.length >= 20);
      })
      .catch(() => {});

    api.get<MeetingDto>(`/matches/${matchId}/meeting`)
      .then(({ data }) => { if (data) setMeeting(data); })
      .catch(() => {});

    api.post(`/matches/${matchId}/read`).catch(() => {});
    clearUnread(matchId);

    const socket = connectSocket();
    socket.emit('chat:join', { matchId });

    socket.on('chat:message', (msg: MessageDto) => {
      if (msg.senderId === userId) return;
      setMessages((m) => [...m, msg]);
      api.post(`/matches/${matchId}/read`).catch(() => {});
      clearUnread(matchId);
    });

    socket.on('chat:read', ({ userId: readerId, readAt }: { userId: string; readAt: string }) => {
      if (readerId !== userId) setPartnerReadAt(readAt);
    });

    socket.on('meeting:updated', (m: MeetingDto) => setMeeting(m));

    return () => {
      socket.off('chat:message');
      socket.off('chat:read');
      socket.off('meeting:updated');
    };
  }, [matchId, userId]);

  useEffect(() => {
    if (!loadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMore]);

  async function loadMore() {
    if (!hasMore || loadingMore || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;
    const prevScrollHeight = scrollRef.current?.scrollHeight ?? 0;
    setLoadingMore(true);
    try {
      const { data } = await api.get<MessageDto[]>(`/matches/${matchId}/messages`, {
        params: { before: oldest.createdAt, limit: 20 },
      });
      const older = data.reverse();
      setMessages((m) => [...older, ...m]);
      setHasMore(data.length >= 20);
      // restore scroll position after prepend
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight - prevScrollHeight;
        }
      });
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    setDraft('');
    try {
      const { data } = await api.post<MessageDto>(`/matches/${matchId}/messages`, { text });
      setMessages((m) => [...m, data]);
    } catch {
      toast.error('傳送失敗，請稍後再試');
    } finally {
      setSending(false);
    }
  }

  async function cancelMeeting() {
    if (!meeting) return;
    try {
      const { data } = await api.delete<MeetingDto>(`/meetings/${meeting.id}`);
      setMeeting(data);
      setShowCancelConfirm(false);
      const isBenign = data.status === 'CANCELLED_BENIGN';
      toast[isBenign ? 'success' : 'warning'](
        isBenign ? `已取消，${meeting.escrow} 肉乾退回錢包` : `已取消，${meeting.escrow} 肉乾補償給對方`,
      );
    } catch {
      toast.error('取消失敗，請稍後再試');
    }
  }

  async function createMeeting() {
    if (balance < 5) { toast.error('肉乾不足，請先儲值'); return; }
    setScheduleLoading(true);
    try {
      const dt = new Date();
      dt.setDate(dt.getDate() + dayOffset);
      dt.setHours(hour, 0, 0, 0);
      const { data } = await api.post<MeetingDto>('/meetings', { matchId, scheduledAt: dt.toISOString() });
      deductBalance(5);
      setMeeting(data);
      setShowSchedule(false);
      toast.success('約會已建立，5 肉乾已託管 🐾');
    } catch {
      toast.error('建立失敗，請稍後再試');
    } finally {
      setScheduleLoading(false);
    }
  }

  const myMessages = messages.filter((m) => m.senderId === userId);
  const lastMyMessage = myMessages[myMessages.length - 1];
  const isLastRead = lastMyMessage && partnerReadAt && partnerReadAt >= lastMyMessage.createdAt;

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hhmm = d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    return sameDay ? hhmm : `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-950 shrink-0">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-sm font-semibold flex-1">配對對話</h1>
        <button
          onClick={() => setShowSchedule(true)}
          className="p-1.5 text-zinc-400 hover:text-white transition-colors"
          title="發起 Go! 約會"
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* Meeting card */}
      {meeting && (
        <div className="mx-4 mt-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 shrink-0">
          {meeting.status === 'COMPLETED' ? (
            <p className="text-sm text-white text-center">約會已完成 🎉</p>
          ) : meeting.status.startsWith('CANCELLED') ? (
            <p className="text-sm text-zinc-500 text-center">約會已取消</p>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">進行中的約會</p>
                  <p className="text-sm text-white mt-1">{new Date(meeting.scheduledAt).toLocaleString('zh-TW')}</p>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <QrCode size={14} />
                  <span className="text-xs font-mono">托管 {meeting.escrow} 🥩</span>
                </div>
              </div>
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="mt-3 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center"
              >
                取消約會
              </button>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {hasMore && (
          <div className="flex justify-center pb-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors disabled:opacity-50"
            >
              {loadingMore ? '載入中…' : '載入更多訊息'}
            </button>
          </div>
        )}
        {messages.length === 0 && (
          <p className="text-center text-zinc-600 text-sm pt-8">傳個訊息打個招呼吧 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          const isLastMine = isMe && msg.id === lastMyMessage?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-2xl px-4 py-2.5 max-w-[75%] text-sm leading-relaxed ${
                isMe ? 'bg-white text-black' : 'bg-zinc-800 text-white'
              }`}>
                {msg.text}
              </div>
              <span className={`text-[10px] text-zinc-500 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                {formatTime(msg.createdAt)}
              </span>
              {isLastMine && isLastRead && (
                <div className="flex items-center gap-1 mr-1">
                  <CheckCheck size={12} className="text-zinc-400" />
                  <span className="text-[10px] text-zinc-500">已讀</span>
                </div>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="訊息…"
          className="flex-1 bg-zinc-900 border-zinc-800 text-white rounded-full px-4"
          disabled={sending}
        />
        <Button type="submit" size="icon" disabled={sending || !draft.trim()} className="rounded-full bg-white hover:bg-zinc-100 shrink-0">
          <Send size={16} className="text-black" />
        </Button>
      </form>

      {/* Schedule modal */}
      {showSchedule && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowSchedule(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl p-5 pb-8 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
            <p className="text-white font-semibold text-base mb-4">發起 Go! 約會</p>

            <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">選擇日期（今後 N 天）</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {DAYS.map((d) => (
                <button key={d} onClick={() => setDayOffset(d)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${dayOffset === d ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-300'}`}>
                  +{d}天
                </button>
              ))}
            </div>

            <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">選擇時間</p>
            <div className="flex gap-2 mb-4 flex-wrap">
              {HOURS.map((h) => (
                <button key={h} onClick={() => setHour(h)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold ${hour === h ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-300'}`}>
                  {h}:00
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-zinc-700 px-4 py-3 mb-4 bg-black/30">
              <p className="text-zinc-400 text-xs leading-relaxed">
                發起約會將扣除 <span className="text-white">5 塊肉乾 🥩</span> 作為誠意金，由平台託管。
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-zinc-700" onClick={() => setShowSchedule(false)}>取消</Button>
              <Button className="flex-1 bg-white text-black hover:bg-zinc-100" onClick={createMeeting} disabled={scheduleLoading}>
                {scheduleLoading ? '建立中…' : '確認並扣除 5 🥩'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirm */}
      {showCancelConfirm && meeting && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 px-6">
          <div className="w-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
            <p className="text-white font-semibold text-base mb-2">取消約會</p>
            <p className="text-zinc-400 text-sm mb-5 leading-relaxed">
              確定取消嗎？距約定時間 2 小時內取消，{meeting.escrow} 塊肉乾將補償給對方。
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-zinc-700" onClick={() => setShowCancelConfirm(false)}>不取消</Button>
              <Button className="flex-1 bg-red-900 hover:bg-red-800 text-white border-0" onClick={cancelMeeting}>確定取消</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
