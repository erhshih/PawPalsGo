import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Star, Sliders, Beef, MapPin, Check, MessageCircle, User } from 'lucide-react-native';
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
const CARD_H = SH * 0.68;
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
  const swiping = useRef(false);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);
  const cardOpacity = useSharedValue(1);

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

  function advance() {
    swiping.current = false;
    setQueue((q) => q.slice(1));
    tx.value = 0; ty.value = 0; rot.value = 0; cardOpacity.value = 1;
    if (queue.length < 4) fetchNextPage();
  }

  function animateOff(toX: number, toY: number, toR: number, cb: () => void) {
    tx.value = withTiming(toX, { duration: 300 });
    ty.value = withTiming(toY, { duration: 300 });
    rot.value = withTiming(toR, { duration: 300 });
    cardOpacity.value = withTiming(0, { duration: 300 }, () => runOnJS(cb)());
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
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { rotate: `${rot.value}deg` }],
    opacity: cardOpacity.value,
  }));

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [20, 100], [0, 1], Extrapolation.CLAMP),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-20, -100], [0, 1], Extrapolation.CLAMP),
  }));
  const superStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [-20, -80], [0, 1], Extrapolation.CLAMP),
  }));

  const top = queue[0];
  const next = queue[1];
  const topDist = top ? distanceMap.get(top.id) : undefined;
  const distLabel = topDist != null
    ? topDist < 1000 ? `${Math.round(topDist)} m` : `${(topDist / 1000).toFixed(1)} km`
    : '附近';
  const photoUri = top?.avatarUrl ? `${API_URL}${top.avatarUrl}` : null;
  const nextPhotoUri = next?.avatarUrl ? `${API_URL}${next.avatarUrl}` : null;

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
        <Pressable onPress={() => router.push('/(app)/profile/discover-settings')} className="rounded-full border border-zinc-800 p-2" style={{ borderWidth: 0.5 }}>
          <Sliders size={14} color="#d4d4d8" />
        </Pressable>
        <Text className="text-[20px] font-bold text-white tracking-tight">
          PawPals <Text className="italic font-light text-zinc-500">Go.</Text>
        </Text>
        <View className="rounded-full border border-zinc-800 px-3 py-1" style={{ borderWidth: 0.5 }}>
          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-300">
            {role === 'OWNER' ? 'OWNER' : 'LOVER'}
          </Text>
        </View>
      </View>

      {/* Card area */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingBottom: 8 }}>
        {/* Back card */}
        {next && (
          <View
            className="absolute rounded-[24px] bg-zinc-900 overflow-hidden border border-zinc-800"
            style={{ left: 16, right: 16, top: 0, height: CARD_H, transform: [{ scale: 0.95 }, { translateY: 10 }], opacity: 0.6, borderWidth: 0.5 }}
          >
            {nextPhotoUri
              ? <Image source={{ uri: nextPhotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a' }}>
                  <User size={48} color="#3f3f46" strokeWidth={1} />
                </View>
            }
          </View>
        )}

        {/* Top card */}
        {top ? (
          <GestureDetector gesture={pan}>
            <Animated.View
              style={[cardStyle, { height: CARD_H, borderRadius: 24, overflow: 'hidden', position: 'relative' }]}
              className="border border-zinc-800 bg-zinc-900"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ position: 'absolute', width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ position: 'absolute', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a' }}>
                  <User size={80} color="#3f3f46" strokeWidth={1} />
                </View>
              )}

              <LinearGradient
                colors={['rgba(0,0,0,0.5)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.95)']}
                locations={[0, 0.5, 1]}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 }}
                pointerEvents="none"
              />

              {/* Role badge top-left */}
              <View className="absolute top-8 left-3 z-20 rounded-full bg-black/50 border border-white/20 px-2 py-1" style={{ borderWidth: 0.5 }}>
                <Text className="font-mono text-[10px] tracking-widest text-white/80">{ROLE_LABEL[top.role] ?? top.role}</Text>
              </View>

              {/* LIKE overlay */}
              <Animated.View style={[likeStyle, { position: 'absolute', top: 40, left: 20, zIndex: 30 }]}>
                <View className="border-2 border-green-400 rounded-xl px-4 py-2" style={{ transform: [{ rotate: '-15deg' }] }}>
                  <Text className="text-green-400 text-[28px] font-black tracking-widest">LIKE</Text>
                </View>
              </Animated.View>

              {/* NOPE overlay */}
              <Animated.View style={[nopeStyle, { position: 'absolute', top: 40, right: 20, zIndex: 30 }]}>
                <View className="border-2 border-red-500 rounded-xl px-4 py-2" style={{ transform: [{ rotate: '15deg' }] }}>
                  <Text className="text-red-500 text-[28px] font-black tracking-widest">NOPE</Text>
                </View>
              </Animated.View>

              {/* SUPER overlay */}
              <Animated.View style={[superStyle, { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', zIndex: 30 }]}>
                <View className="border-2 border-blue-400 rounded-xl px-6 py-2">
                  <Text className="text-blue-400 text-[28px] font-black tracking-widest">SUPER</Text>
                </View>
              </Animated.View>

              {/* Info */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, zIndex: 20 }}>
                <View className="flex-row items-end justify-between">
                  <View className="flex-1">
                    <Text className="text-[30px] font-bold text-white leading-none">
                      {top.displayName ?? top.email.split('@')[0]}
                    </Text>
                    {top.bio ? (
                      <Text className="mt-2 text-white/85 text-[13px] leading-relaxed" numberOfLines={2}>{top.bio}</Text>
                    ) : null}
                    {(top.interests ?? []).length > 0 && (
                      <View className="mt-2 flex-row flex-wrap gap-1.5">
                        {(top.interests ?? []).slice(0, 4).map((t) => <Badge key={t}>{t}</Badge>)}
                      </View>
                    )}
                    <View className="mt-2 flex-row items-center gap-3">
                      <View className="flex-row items-center gap-1.5">
                        <MapPin size={12} color="rgba(255,255,255,0.5)" />
                        <Text className="text-white/50 text-[12px]">{distLabel}</Text>
                      </View>
                      {top.city ? <Text className="text-white/40 text-[12px]">{top.city}</Text> : null}
                    </View>
                  </View>

                  {/* Treat button */}
                  <Pressable
                    onPress={() => setIap(true)}
                    className="ml-3 rounded-full bg-black/50 border border-white/30 p-3 items-center"
                    style={{ borderWidth: 0.5 }}
                  >
                    <Beef size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </GestureDetector>
        ) : (
          <View style={{ height: CARD_H }} className="rounded-[24px] bg-zinc-900 items-center justify-center border border-zinc-800" style={{ borderWidth: 0.5 }}>
            <Text className="text-zinc-500 text-[16px]">附近暫時沒有新朋友</Text>
            <Text className="text-zinc-600 text-[13px] mt-2">試試調整探索距離或身分篩選</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View className="flex-row items-center justify-center gap-5 pb-6 pt-2">
        <Pressable
          onPress={() => swipe('left')}
          className="h-14 w-14 rounded-full border border-zinc-700 items-center justify-center bg-zinc-900"
          style={{ borderWidth: 0.5 }}
        >
          <X size={24} color="#ef4444" strokeWidth={2.5} />
        </Pressable>
        <Pressable
          onPress={() => swipe('up')}
          className="h-12 w-12 rounded-full border border-blue-800/60 items-center justify-center bg-blue-950/50"
          style={{ borderWidth: 0.5 }}
        >
          <Star size={18} color="#60a5fa" fill="#60a5fa" strokeWidth={1.5} />
        </Pressable>
        <Pressable
          onPress={() => swipe('right')}
          className="h-16 w-16 rounded-full bg-green-500 items-center justify-center"
          style={{ shadowColor: '#22c55e', shadowOpacity: 0.4, shadowRadius: 20 }}
        >
          <Heart size={28} color="#fff" fill="#fff" strokeWidth={1.5} />
        </Pressable>
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
