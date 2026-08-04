import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Dimensions, Modal, Alert } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Star, Sliders, Beef, MapPin, Check, MessageCircle, User, EllipsisVertical } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { DiscoverResultDto, MatchDto, UserDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import { useWalletStore } from '../../../stores/wallet';
import { useToastStore } from '../../../stores/toast';
import { useAuthStore } from '../../../stores/auth';
import { useDiscoverPrefs } from '../../../stores/discoverPrefs';
import { useRouter } from 'expo-router';

const { width: SW, height: SH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SW * 0.30;
const SUPER_THRESHOLD = 120;

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const ROLE_LABEL: Record<string, string> = { OWNER: '飼主', LOVER: '愛寵人' };

function Badge({ children }: { children: string }) {
  return (
    <View className="rounded-full border border-white/30 px-2.5 py-1" style={{ borderWidth: 0.5 }}>
      <Text className="font-mono text-[10px] tracking-widest text-white/80">{children}</Text>
    </View>
  );
}

function TreatModal({ open, user, onClose, onBuy }: {
  open: boolean; user: UserDto | null; onClose: () => void; onBuy: () => void;
}) {
  if (!open || !user) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 justify-end" onPress={onClose}>
        <View className="bg-zinc-900 rounded-t-3xl p-5 pb-10 border-t border-zinc-800" style={{ borderWidth: 0.5 }} onStartShouldSetResponder={() => true}>
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
          <View className="flex-row items-center gap-3 mb-5">
            <View className="rounded-full bg-zinc-300 p-2.5">
              <Beef size={18} color="#18181b" />
            </View>
            <View>
              <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">in-app</Text>
              <Text className="text-[17px] font-semibold text-white">投餵肉乾給 {user.displayName ?? user.email}</Text>
            </View>
          </View>
          <View className="rounded-2xl border border-zinc-800 p-4 bg-black/40 mb-5" style={{ borderWidth: 0.5 }}>
            <View className="flex-row items-baseline justify-between mb-3">
              <Text className="text-zinc-400 text-[13px]">高級肉乾 × 1</Text>
              <Text className="text-[22px] font-semibold text-white">NT$ 60</Text>
            </View>
            {['訊息將被優先顯示在對方信箱頂端', '贈送對方一份限定貼紙', '可選擇匿名 / 顯名'].map((t) => (
              <View key={t} className="flex-row items-center gap-2 mt-1.5">
                <Check size={11} color="#fff" />
                <Text className="text-zinc-400 text-[12px]">{t}</Text>
              </View>
            ))}
          </View>
          <View className="flex-row gap-2">
            <Pressable onPress={onClose} className="flex-1 rounded-2xl py-3.5 border border-zinc-700 items-center" style={{ borderWidth: 0.5 }}>
              <Text className="text-zinc-300 text-[13px]">取消</Text>
            </Pressable>
            <Pressable onPress={onBuy} className="flex-1 rounded-2xl py-3.5 bg-white items-center">
              <Text className="text-black text-[13px] font-semibold">確認投餵</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

function MatchModal({ match, onClose, onChat }: { match: MatchDto | null; onClose: () => void; onChat: () => void }) {
  if (!match) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 items-center justify-center px-6">
        <View className="w-full bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-800" style={{ borderWidth: 0.5 }}>
          <Text className="text-[52px]">🐾</Text>
          <Text className="mt-3 text-[30px] font-semibold text-white tracking-tight">配對成功！</Text>
          <Text className="mt-2 text-zinc-400 text-[14px] text-center leading-relaxed">
            你和 {match.partner?.displayName ?? match.partner?.email ?? '對方'} 互相喜歡了
          </Text>
          <Pressable onPress={onChat} className="mt-8 w-full rounded-2xl py-4 bg-white flex-row items-center justify-center gap-2">
            <MessageCircle size={16} color="#000" />
            <Text className="text-black text-[14px] font-semibold">開始聊天</Text>
          </Pressable>
          <Pressable onPress={onClose} className="mt-3 py-2">
            <Text className="text-zinc-500 text-[13px]">繼續探索</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function SwipeDeckScreen() {
  const { userId, role } = useAuthStore();
  const { balance, deductBalance } = useWalletStore();
  const { show } = useToastStore();
  const { radius, getGenderParam, getRoleParam } = useDiscoverPrefs();
  const router = useRouter();

  const [queue, setQueue] = useState<UserDto[]>([]);
  const [page, setPage] = useState(1);
  const [iap, setIap] = useState(false);
  const [matchModal, setMatchModal] = useState<MatchDto | null>(null);
  const [distanceMap, setDistanceMap] = useState<Map<string, number>>(new Map());
  const [cardAreaH, setCardAreaH] = useState(SH * 0.75);
  const swiping = useRef(false);
  const prevTopId = useRef<string | undefined>(undefined);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const backScale = useSharedValue(0.95);

  useEffect(() => {
    async function init() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          await api.patch('/users/me/location', { lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {}
      fetchNextPage(1, radius);
    }
    init();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    if (!socket) return;
    const event = `match:new:${userId}`;
    const handler = async ({ matchId }: { matchId: string }) => {
      try {
        const { data } = await api.get<MatchDto>(`/matches/${matchId}`);
        setMatchModal(data);
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
  }

  // useLayoutEffect 在 paint 前執行，確保新卡片第一幀就不透明，不黑畫面
  useLayoutEffect(() => {
    const topId = queue[0]?.id;
    if (!topId || topId === prevTopId.current) return;
    prevTopId.current = topId;
    tx.value = 0; ty.value = 0; rot.value = 0;
    cardOpacity.value = 1;
  }, [queue[0]?.id]);

  // 後面那張換人時，把 backScale 平滑縮回去
  const prevNextId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const nextId = queue[1]?.id;
    if (!nextId || nextId === prevNextId.current) return;
    prevNextId.current = nextId;
    backScale.value = withTiming(0.95, { duration: 200 });
    // 預先載入下下位的照片
    const uri = toPhotoUri(queue[1]?.avatarUrl);
    if (uri) Image.prefetch(uri).catch(() => {});
  }, [queue[1]?.id]);

  function advance() {
    swiping.current = false;
    tx.value = 0; ty.value = 0; rot.value = 0;
    setQueue((q) => q.slice(1));
    if (queue.length < 4) fetchNextPage();
  }

  function animateOff(toX: number, toY: number, toR: number, cb: () => void) {
    tx.value = withTiming(toX, { duration: 300 });
    ty.value = withTiming(toY, { duration: 300 });
    rot.value = withTiming(toR, { duration: 300 });
    cardOpacity.value = withTiming(0, { duration: 300 }, () => runOnJS(cb)());
    backScale.value = withTiming(1, { duration: 300 });
  }

  async function swipe(dir: 'left' | 'right' | 'up') {
    if (swiping.current || !queue[0]) return;
    swiping.current = true;
    const toX = dir === 'left' ? -SW * 1.5 : dir === 'right' ? SW * 1.5 : 0;
    const toY = dir === 'up' ? -SH : 60;
    const toR = dir === 'left' ? -25 : dir === 'right' ? 25 : 0;
    animateOff(toX, toY, toR, advance);

    const direction = dir === 'left' ? 'PASS' : dir === 'right' ? 'LIKE' : 'SUPER_LIKE';
    try {
      const { data } = await api.post<{ matched: boolean; matchId?: string }>('/swipes', {
        targetUserId: queue[0].id,
        direction,
      });
      if (data.matched && data.matchId) {
        const matchRes = await api.get<MatchDto>(`/matches/${data.matchId}`);
        setMatchModal(matchRes.data);
      }
    } catch {}
  }

  function openSafetyMenu() {
    if (!queue[0]) return;
    const target = queue[0];
    Alert.alert(target.displayName ?? target.email, undefined, [
      { text: '檢舉', onPress: () => router.push({ pathname: '/(app)/report/create', params: { targetId: target.id } }) },
      {
        text: '封鎖', style: 'destructive',
        onPress: () => {
          Alert.alert('封鎖此使用者', '封鎖後你們將不會再看到彼此，也無法互傳訊息。確定要封鎖嗎？', [
            { text: '取消', style: 'cancel' },
            {
              text: '封鎖', style: 'destructive',
              onPress: async () => {
                try {
                  await api.post(`/blocks/${target.id}`);
                  show('已封鎖', 'success');
                  advance();
                } catch { show('操作失敗，請稍後再試'); }
              },
            },
          ]);
        },
      },
      { text: '取消', style: 'cancel' },
    ]);
  }

  async function sendTreat() {
    if (!queue[0]) return;
    if (balance < 1) { show('肉乾不足，請先儲值'); setIap(false); return; }
    try {
      await api.post(`/swipes/${queue[0].id}/treat`);
      deductBalance(1);
      setIap(false);
      show('🥩 投餵成功！', 'success');
    } catch {
      show('投餵失敗，請稍後再試');
    }
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY * 0.25;
      rot.value = (e.translationX / SW) * 18;
      const progress = Math.min(Math.abs(e.translationX) / SWIPE_THRESHOLD, 1);
      backScale.value = 0.95 + 0.05 * progress;
    })
    .onEnd((e) => {
      const goRight = e.translationX > SWIPE_THRESHOLD;
      const goLeft = e.translationX < -SWIPE_THRESHOLD;
      const goUp = e.translationY < -SUPER_THRESHOLD;
      if (goRight) { runOnJS(swipe)('right'); }
      else if (goLeft) { runOnJS(swipe)('left'); }
      else if (goUp) { runOnJS(swipe)('up'); }
      else {
        tx.value = withSpring(0, { damping: 20 });
        ty.value = withSpring(0, { damping: 20 });
        rot.value = withSpring(0, { damping: 20 });
        backScale.value = withSpring(0.95, { damping: 20 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: cardOpacity.value,
  }));

  const backCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }, { translateY: 10 }],
  }));

  // 卡片上的 LIKE / NOPE / SUPER 文字 stamp
  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [20, 100], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-20, -100], [0, 1], Extrapolation.CLAMP),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-20, -80], [0, 1], Extrapolation.CLAMP),
  }));

  // 底部固定 icon：只顯示當前滑動方向的 icon，其他隱藏
  const passIconStyle = useAnimatedStyle(() => {
    if (tx.value > 20 || ty.value < -20) return { opacity: 0, transform: [{ scale: 1 }] };
    return {
      transform: [{ scale: interpolate(tx.value, [0, -SWIPE_THRESHOLD], [1, 1.6], Extrapolation.CLAMP) }],
      opacity: interpolate(tx.value, [0, -40, -SWIPE_THRESHOLD], [0.5, 0.85, 1], Extrapolation.CLAMP),
    };
  });
  const likeIconStyle = useAnimatedStyle(() => {
    if (tx.value < -20 || ty.value < -20) return { opacity: 0, transform: [{ scale: 1 }] };
    return {
      transform: [{ scale: interpolate(tx.value, [0, SWIPE_THRESHOLD], [1, 1.6], Extrapolation.CLAMP) }],
      opacity: interpolate(tx.value, [0, 40, SWIPE_THRESHOLD], [0.5, 0.85, 1], Extrapolation.CLAMP),
    };
  });
  const superIconStyle = useAnimatedStyle(() => {
    if (Math.abs(tx.value) > 20) return { opacity: 0, transform: [{ scale: 1 }] };
    return {
      transform: [{ scale: interpolate(ty.value, [0, -SUPER_THRESHOLD], [1, 1.6], Extrapolation.CLAMP) }],
      opacity: interpolate(ty.value, [0, -40, -SUPER_THRESHOLD], [0.5, 0.85, 1], Extrapolation.CLAMP),
    };
  });

  const top = queue[0];
  const next = queue[1];
  const topDist = top ? distanceMap.get(top.id) : undefined;
  const distLabel = topDist != null
    ? topDist < 1000 ? `${Math.round(topDist)} m` : `${(topDist / 1000).toFixed(1)} km`
    : '附近';
  function toPhotoUri(url?: string | null) {
    if (!url) return null;
    return url.startsWith('http') ? url : `${API_URL}${url}`;
  }
  const photoUri = toPhotoUri(top?.avatarUrl);
  const nextPhotoUri = toPhotoUri(next?.avatarUrl);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
      {/* 外層卡片容器 — 圓角框包住照片區 + 按鈕區，底部留空給浮動 tab bar */}
      <View style={{ flex: 1, marginHorizontal: 0, marginBottom: 90, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)' }}>

        {/* 照片滑動區 */}
        <View style={{ flex: 1 }} onLayout={(e) => setCardAreaH(e.nativeEvent.layout.height - 4)}>

          {/* 背景卡 */}
          {next && (
            <Animated.View style={[backCardStyle, { position: 'absolute', left: 0, right: 0, top: 0, height: cardAreaH, overflow: 'hidden', backgroundColor: '#2c2c2e' }]}>
              {nextPhotoUri ? (
                <Image source={{ uri: nextPhotoUri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2c2c2e' }}>
                  <User size={80} color="#3f3f46" strokeWidth={1} />
                </View>
              )}
              <LinearGradient colors={['transparent', 'rgba(28,28,30,0.7)', 'rgba(28,28,30,0.97)']} locations={[0, 0.5, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 280 }} pointerEvents="none" />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 148, paddingHorizontal: 16, paddingBottom: 14, justifyContent: 'flex-end' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                  <MapPin size={11} color="rgba(255,255,255,0.5)" />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{next.city ?? '附近'}</Text>
                </View>
                <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 30 }} numberOfLines={1}>
                  {next.displayName ?? next.email.split('@')[0]}
                </Text>
                <Text style={{ marginTop: 3, color: 'rgba(255,255,255,0.75)', fontSize: 13, lineHeight: 17, minHeight: 34 }} numberOfLines={2}>
                  {next.bio ?? ''}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* 頂部卡 */}
          {top ? (
            <GestureDetector gesture={pan}>
              <Animated.View key={top.id} style={[cardStyle, { height: cardAreaH, overflow: 'hidden', backgroundColor: '#2c2c2e' }]}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2c2c2e' }}>
                    <User size={80} color="#3f3f46" strokeWidth={1} />
                  </View>
                )}
                <LinearGradient colors={['rgba(28,28,30,0.25)', 'transparent']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80 }} pointerEvents="none" />
                <LinearGradient colors={['transparent', 'rgba(28,28,30,0.6)', 'rgba(28,28,30,0.96)']} locations={[0, 0.45, 1]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 360 }} pointerEvents="none" />

                {/* 身分角標 */}
                <View style={{ position: 'absolute', top: 12, left: 12, borderRadius: 999, backgroundColor: 'rgba(28,28,30,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Text style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.85)' }}>{ROLE_LABEL[top.role] ?? top.role}</Text>
                </View>

                {/* LIKE / NOPE / SUPER stamps */}
                <Animated.View style={[likeStyle, { position: 'absolute', top: 44, left: 20, zIndex: 30 }]}>
                  <View style={{ borderWidth: 2, borderColor: '#4ade80', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, transform: [{ rotate: '-15deg' }] }}>
                    <Text style={{ color: '#4ade80', fontSize: 26, fontWeight: '900', letterSpacing: 2 }}>LIKE</Text>
                  </View>
                </Animated.View>
                <Animated.View style={[nopeStyle, { position: 'absolute', top: 44, right: 20, zIndex: 30 }]}>
                  <View style={{ borderWidth: 2, borderColor: '#ef4444', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, transform: [{ rotate: '15deg' }] }}>
                    <Text style={{ color: '#ef4444', fontSize: 26, fontWeight: '900', letterSpacing: 2 }}>NOPE</Text>
                  </View>
                </Animated.View>
                <Animated.View style={[superStyle, { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 30 }]}>
                  <View style={{ borderWidth: 2, borderColor: '#60a5fa', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 6 }}>
                    <Text style={{ color: '#60a5fa', fontSize: 26, fontWeight: '900', letterSpacing: 2 }}>SUPER</Text>
                  </View>
                </Animated.View>

                {/* 固定高度 info */}
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 148, paddingHorizontal: 16, paddingBottom: 14, justifyContent: 'flex-end', zIndex: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <MapPin size={11} color="rgba(255,255,255,0.5)" />
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{distLabel}</Text>
                        {top.city ? <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginLeft: 2 }}>{top.city}</Text> : null}
                      </View>
                      <Text style={{ fontSize: 26, fontWeight: '700', color: '#fff', lineHeight: 30 }} numberOfLines={1}>
                        {top.displayName ?? top.email.split('@')[0]}
                      </Text>
                      <Text style={{ marginTop: 3, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 17, minHeight: 34 }} numberOfLines={2}>
                        {top.bio ?? ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => setIap(true)} style={{ marginLeft: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(28,28,30,0.6)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                      <Beef size={16} color="#fff" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </GestureDetector>
          ) : (
            <View style={{ height: cardAreaH, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#71717a', fontSize: 16 }}>附近暫時沒有新朋友</Text>
              <Text style={{ color: '#52525b', fontSize: 13, marginTop: 6 }}>試試調整探索距離或身分篩選</Text>
            </View>
          )}

          {/* 篩選 icon — 疊在照片左上角 */}
          <Pressable
            onPress={() => router.push('/(app)/profile/discover-settings')}
            style={{ position: 'absolute', top: 12, left: 12, zIndex: 100, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(28,28,30,0.55)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Sliders size={15} color="#fff" />
          </Pressable>

          {/* 檢舉 / 封鎖 選單 — 疊在照片右上角 */}
          {top && (
            <Pressable
              onPress={openSafetyMenu}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 100, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(28,28,30,0.55)', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
            >
              <EllipsisVertical size={15} color="#fff" />
            </Pressable>
          )}
        </View>

        {/* 按鈕列 — 在卡片圓角框內，固定不動（不在 GestureDetector 裡） */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 52, paddingVertical: 14, backgroundColor: '#1c1c1e' }}>
          <Animated.View style={passIconStyle}>
            <Pressable onPress={() => swipe('left')} hitSlop={20}>
              <X size={34} color="#ef4444" strokeWidth={2.5} />
            </Pressable>
          </Animated.View>
          <Animated.View style={superIconStyle}>
            <Pressable onPress={() => swipe('up')} hitSlop={20}>
              <Star size={28} color="#60a5fa" fill="#60a5fa" strokeWidth={1.5} />
            </Pressable>
          </Animated.View>
          <Animated.View style={likeIconStyle}>
            <Pressable onPress={() => swipe('right')} hitSlop={20}>
              <Heart size={38} color="#22c55e" fill="#22c55e" strokeWidth={1.5} />
            </Pressable>
          </Animated.View>
        </View>
      </View>

      <TreatModal open={iap} user={top ?? null} onClose={() => setIap(false)} onBuy={sendTreat} />
      <MatchModal
        match={matchModal}
        onClose={() => setMatchModal(null)}
        onChat={() => { setMatchModal(null); router.push('/(app)/(tabs)/chat'); }}
      />
    </SafeAreaView>
  );
}
