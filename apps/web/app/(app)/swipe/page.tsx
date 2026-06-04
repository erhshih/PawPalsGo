'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useWalletStore } from '@/stores/wallet';
import { useAuthStore } from '@/stores/auth';
import { useDiscoverPrefs } from '@/stores/discoverPrefs';
import { connectSocket } from '@/lib/socket';
import { DiscoverResultDto, MatchDto, UserDto } from '@pawpals/shared';
import { X, Heart, Star, MapPin, Beef, MessageCircle, Sliders, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const ROLE_LABEL: Record<string, string> = { OWNER: '飼主', LOVER: '愛寵人' };

export default function SwipePage() {
  const router = useRouter();
  const [queue, setQueue] = useState<UserDto[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showTreat, setShowTreat] = useState(false);
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [distanceMap, setDistanceMap] = useState<Map<string, number>>(new Map());
  const [locationDenied, setLocationDenied] = useState(false);
  // 拖曳狀態
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const swiping = useRef(false);
  const { balance, deductBalance } = useWalletStore();
  const { userId, loadFromStorage } = useAuthStore();
  const { radius, getGenderParam, getRoleParam } = useDiscoverPrefs();

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    async function init() {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        let permState = 'prompt';
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          permState = perm.state;
        } catch {
          // permissions API 不支援時（舊瀏覽器）視為 prompt
        }

        if (permState === 'denied') {
          setLocationDenied(true);
        } else {
          // 'granted' 或 'prompt' 都呼叫，prompt 會跳出授權視窗
          await new Promise<void>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                await api.patch('/users/me/location', { lat: pos.coords.latitude, lng: pos.coords.longitude }).catch(() => {});
                resolve();
              },
              () => {
                setLocationDenied(true);
                resolve();
              },
              { timeout: 10000 },
            );
          });
        }
      }
      fetchNextPage(1);
    }
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = connectSocket();
    const event = `match:new:${userId}`;
    const handler = async ({ matchId }: { matchId: string }) => {
      try {
        const { data } = await api.get<MatchDto>(`/matches/${matchId}`);
        setMatchedName(data.partner?.displayName ?? data.partner?.email ?? '對方');
      } catch {}
    };
    socket.on(event, handler);
    return () => { socket.off(event, handler); };
  }, [userId]);

  async function fetchNextPage(p = page, r = radius) {
    try {
      const genderParam = getGenderParam();
      const roleParam = getRoleParam();
      const params: Record<string, unknown> = { page: p, limit: 10, radius: r };
      if (genderParam) params.gender = genderParam;
      if (roleParam) params.roleFilter = roleParam;
      const { data } = await api.get<DiscoverResultDto[]>('/discover', { params });
      const users = data.map((item) => item.user).filter(Boolean) as UserDto[];
      if (users.length > 0) {
        const dists = new Map<string, number>();
        data.forEach((item) => { if (item.user) dists.set(item.user.id, item.distanceM); });
        setDistanceMap((m) => new Map([...m, ...dists]));
        setQueue((q) => [...q, ...users]);
        setPage(p + 1);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function swipe(direction: 'LIKE' | 'PASS' | 'SUPER_LIKE') {
    if (swiping.current) return;
    const top = queue[0];
    if (!top) return;
    swiping.current = true;
    // 飛出動畫
    const toX = direction === 'LIKE' ? 600 : direction === 'PASS' ? -600 : 0;
    const toY = direction === 'SUPER_LIKE' ? -600 : 0;
    setDrag({ x: toX, y: toY, dragging: false });
    await new Promise((r) => setTimeout(r, 280));
    setDrag({ x: 0, y: 0, dragging: false });
    swiping.current = false;
    setQueue((q) => q.slice(1));
    if (queue.length < 3) fetchNextPage();
    try {
      const { data } = await api.post<{ matched: boolean; matchId?: string }>('/swipes', {
        targetUserId: top.id,
        direction,
      });
      if (data.matched && data.matchId) {
        const matchRes = await api.get<MatchDto>(`/matches/${data.matchId}`).catch(() => null);
        setMatchedName(matchRes?.data?.partner?.displayName ?? matchRes?.data?.partner?.email ?? '對方');
      }
    } catch {}
  }

  // 拖曳 handlers
  function onPointerDown(e: React.PointerEvent) {
    if (swiping.current) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setDrag({ x: 0, y: 0, dragging: true });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    setDrag({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y, dragging: true });
  }

  function onPointerUp(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    dragStart.current = null;
    const SWIPE_X = 100;
    const SWIPE_Y = 80;
    if (dx > SWIPE_X) { swipe('LIKE'); }
    else if (dx < -SWIPE_X) { swipe('PASS'); }
    else if (dy < -SWIPE_Y) { swipe('SUPER_LIKE'); }
    else { setDrag({ x: 0, y: 0, dragging: false }); }
  }

  async function sendTreat() {
    const top = queue[0];
    if (!top) return;
    if (balance < 1) { toast.error('肉乾不足，請先儲值'); setShowTreat(false); return; }
    try {
      await api.post(`/swipes/${top.id}/treat`);
      deductBalance(1);
      setShowTreat(false);
      toast.success('🥩 已投餵肉乾！');
    } catch {
      toast.error('投餵失敗，請稍後再試');
    }
  }

  const top = queue[0];
  const rawUrl = top?.avatarUrl;
  const photoSrc = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${API_URL}${rawUrl}`) : null;
  const topDist = top ? distanceMap.get(top.id) : undefined;
  const distLabel = topDist != null
    ? topDist < 1000 ? `${Math.round(topDist)} m` : `${(topDist / 1000).toFixed(1)} km`
    : '附近';

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-zinc-500 text-sm">載入中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center h-full pt-4 px-4 overflow-hidden">
      <div className="w-full max-w-sm flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <button
            onClick={() => router.push('/profile/discover-settings')}
            className="rounded-full border border-zinc-700 p-2 hover:bg-zinc-800 transition-colors"
          >
            <Sliders size={14} className="text-zinc-300" />
          </button>
          <h1 className="text-lg font-semibold">
            PawPals <span className="italic font-light text-zinc-500">Go.</span>
          </h1>
          <div className="w-8" />
        </div>

        {/* Card */}
        <div className="flex-1 min-h-0">
          {top ? (
            <div
              key={top.id}
              className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 h-full w-full cursor-grab active:cursor-grabbing select-none"
              style={{
                transform: `translateX(${drag.x}px) translateY(${drag.y * 0.3}px) rotate(${drag.x * 0.06}deg)`,
                transition: drag.dragging ? 'none' : 'transform 0.28s cubic-bezier(0.25,0.46,0.45,0.94)',
                touchAction: 'none',
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => { dragStart.current = null; setDrag({ x: 0, y: 0, dragging: false }); }}
            >
              {photoSrc ? (
                <Image src={photoSrc} alt={top.displayName ?? ''} fill className="object-cover pointer-events-none" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                  <User size={80} className="text-zinc-600" strokeWidth={1} />
                </div>
              )}

              {/* Gradient */}
              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/70 to-transparent" />

              {/* LIKE / NOPE stamps */}
              {drag.x > 30 && (
                <div className="absolute top-10 left-5 z-20 border-2 border-green-400 rounded-xl px-4 py-1.5 -rotate-12">
                  <span className="text-green-400 text-2xl font-black tracking-widest">LIKE</span>
                </div>
              )}
              {drag.x < -30 && (
                <div className="absolute top-10 right-5 z-20 border-2 border-red-500 rounded-xl px-4 py-1.5 rotate-12">
                  <span className="text-red-500 text-2xl font-black tracking-widest">NOPE</span>
                </div>
              )}
              {drag.y < -40 && Math.abs(drag.x) < 40 && (
                <div className="absolute top-1/3 inset-x-0 flex justify-center z-20">
                  <div className="border-2 border-blue-400 rounded-xl px-5 py-1.5">
                    <span className="text-blue-400 text-2xl font-black tracking-widest">SUPER</span>
                  </div>
                </div>
              )}

              {/* Role badge */}
              <div className="absolute top-3 left-3 z-10 rounded-full bg-black/50 border border-white/20 px-2.5 py-1">
                <span className="font-mono text-[10px] tracking-widest text-white/80">{ROLE_LABEL[top.role] ?? top.role}</span>
              </div>

              {/* Info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between z-10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold text-white">
                    {top.displayName ?? top.email.split('@')[0]}
                  </h2>
                  {top.bio && (
                    <p className="text-white/80 text-sm mt-2 leading-relaxed line-clamp-2">{top.bio}</p>
                  )}
                  {(top.interests ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(top.interests ?? []).slice(0, 4).map((t) => (
                        <Badge key={t} variant="outline" className="border-zinc-600 text-zinc-300 text-[10px] font-mono tracking-widest">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-zinc-500" />
                      <span className="text-zinc-400 text-xs">{distLabel}</span>
                    </div>
                    {top.city && <span className="text-zinc-500 text-xs">{top.city}</span>}
                  </div>
                </div>
                {/* Treat button */}
                <button
                  onClick={() => setShowTreat(true)}
                  className="ml-3 shrink-0 rounded-2xl border border-white/30 bg-black/40 p-2.5 flex flex-col items-center gap-1 hover:bg-black/60 transition-colors"
                >
                  <Beef size={18} className="text-white" />
                  <span className="font-mono text-[9px] tracking-widest text-white uppercase">投餵肉乾</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900 gap-2 px-6 text-center">
              {locationDenied ? (
                <>
                  <p className="text-zinc-400 text-sm">請開啟瀏覽器位置權限</p>
                  <p className="text-zinc-600 text-xs">開啟後重新整理頁面，即可看見附近的毛孩</p>
                </>
              ) : (
                <>
                  <p className="text-zinc-500 text-sm">附近暫時沒有新朋友</p>
                  <p className="text-zinc-600 text-xs">試試調整探索距離或身分篩選</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-8 py-4 shrink-0">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800" onClick={() => swipe('PASS')}>
            <X size={22} className="text-zinc-300" />
          </Button>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-zinc-700 bg-zinc-900 hover:bg-zinc-800" onClick={() => swipe('SUPER_LIKE')}>
            <Star size={18} className="text-zinc-300" />
          </Button>
          <Button size="icon" className="h-16 w-16 rounded-full bg-white hover:bg-zinc-100" onClick={() => swipe('LIKE')}>
            <Heart size={26} className="text-black fill-black" />
          </Button>
        </div>
      </div>

      {/* Match modal */}
      {matchedName && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 px-6">
          <div className="w-full bg-zinc-900 rounded-3xl p-8 flex flex-col items-center border border-zinc-800">
            <span className="text-5xl">🐾</span>
            <h2 className="mt-4 text-2xl font-semibold text-white">配對成功！</h2>
            <p className="mt-2 text-zinc-400 text-sm text-center">你和 {matchedName} 互相喜歡了</p>
            <Button className="mt-8 w-full rounded-2xl bg-white text-black hover:bg-zinc-100" onClick={() => { setMatchedName(null); router.push('/chat'); }}>
              <MessageCircle size={16} className="mr-2" />
              開始聊天
            </Button>
            <button className="mt-3 text-zinc-600 text-sm" onClick={() => setMatchedName(null)}>繼續探索</button>
          </div>
        </div>
      )}

      {/* Treat modal */}
      {showTreat && top && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowTreat(false)}>
          <div className="w-full bg-zinc-900 rounded-t-3xl p-5 pb-8 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-full bg-zinc-300 p-2.5">
                <Beef size={18} className="text-zinc-900" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">in-app</p>
                <p className="text-lg font-semibold text-white">投餵肉乾給 {top.displayName ?? top.email.split('@')[0]}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800 p-4 bg-black/40 mb-4">
              <div className="flex items-baseline justify-between">
                <span className="text-zinc-400 text-sm">高級肉乾 × 1</span>
                <span className="text-2xl font-semibold text-white">NT$ 60</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 border-zinc-700" onClick={() => setShowTreat(false)}>取消</Button>
              <Button className="flex-1 bg-white text-black hover:bg-zinc-100" onClick={sendTreat}>確認購買</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
