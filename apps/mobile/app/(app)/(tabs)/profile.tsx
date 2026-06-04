import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Image, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, User, Beef, Plus, ChevronRight, Check, PenLine } from 'lucide-react-native';
import { WalletDto, WALLET_PACKAGES, WalletPackageId, UserDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import { useWalletStore } from '../../../stores/wallet';
import { useToastStore } from '../../../stores/toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function TopUpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addBalance } = useWalletStore();
  const { show } = useToastStore();
  const [loading, setLoading] = useState<string | null>(null);

  async function purchase(pkgId: WalletPackageId) {
    setLoading(pkgId);
    try {
      const { data } = await api.post<{ added: number; newBalance: number }>('/wallet/topup', { packageId: pkgId });
      addBalance(data.added);
      show(`已儲值 ${data.added} 塊肉乾！`, 'success');
      onClose();
    } catch {
      show('儲值失敗，請稍後再試');
    } finally {
      setLoading(null);
    }
  }

  if (!open) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 0.5, borderColor: '#27272a' }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3f3f46', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ borderRadius: 999, backgroundColor: '#d4d4d8', padding: 10 }}>
              <Beef size={18} color="#18181b" />
            </View>
            <View>
              <Text style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#71717a' }}>in-app purchase</Text>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>儲值肉乾</Text>
            </View>
          </View>
          <View style={{ gap: 12 }}>
            {WALLET_PACKAGES.map((pkg) => (
              <Pressable
                key={pkg.id}
                onPress={() => purchase(pkg.id)}
                disabled={!!loading}
                style={{ borderRadius: 16, borderWidth: 0.5, borderColor: '#27272a', padding: 16, backgroundColor: 'rgba(0,0,0,0.3)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{pkg.jerky} 肉乾</Text>
                  <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{pkg.price}</Text>
                </View>
                <Pressable
                  onPress={() => purchase(pkg.id)}
                  disabled={!!loading}
                  style={{ borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: loading === pkg.id ? '#27272a' : '#fff' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: loading === pkg.id ? '#71717a' : '#000' }}>
                    {loading === pkg.id ? '處理中…' : '購買'}
                  </Text>
                </Pressable>
              </Pressable>
            ))}
          </View>
          <Text style={{ marginTop: 16, textAlign: 'center', fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#3f3f46' }}>
            purely cosmetic · no real charge
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function calcCompletion(profile: UserDto | null): { pct: number; missing: { label: string; hint: string }[] } {
  if (!profile) return { pct: 0, missing: [] };
  const checks = [
    { done: !!profile.avatarUrl, label: '上傳個人照片', hint: '加上照片，配對率提高 25%。' },
    { done: !!profile.displayName, label: '新增顯示名稱', hint: '讓其他人認識你。' },
    { done: !!profile.bio, label: '新增個人簡介', hint: '分享你的故事，別人才能真正了解你。' },
    { done: (profile.interests?.length ?? 0) > 0, label: '新增你的興趣', hint: '分享你的興趣所在，別人才能真正了解你。' },
    { done: !!profile.zodiac, label: '新增星座', hint: '幫助更多人找到你。' },
    { done: !!profile.city, label: '新增居住城市', hint: '讓附近的人更容易發現你。' },
  ];
  const done = checks.filter((c) => c.done).length;
  const missing = checks.filter((c) => !c.done);
  return { pct: Math.round((done / checks.length) * 100), missing };
}

export default function ProfileScreen() {
  const router = useRouter();
  const { balance, setBalance, addBalance } = useWalletStore();
  const { show } = useToastStore();
  const [showTopUp, setShowTopUp] = useState(false);
  const [stats, setStats] = useState({ matches: 0, messages: 0 });
  const [profile, setProfile] = useState<UserDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get<WalletDto>('/wallet').then(({ data }) => setBalance(data.balance)).catch(() => {});
      api.get<{ matches: number; messages: number }>('/users/me/stats').then(({ data }) => setStats(data)).catch(() => {});
      api.get<UserDto>('/users/me').then(({ data }) => setProfile(data)).catch(() => {});
    }, []),
  );

  const name = profile?.displayName || profile?.email?.split('@')[0] || '';
  const rawUrl = profile?.avatarUrl;
  const photoUri = rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `${API_URL}${rawUrl}`) : null;
  const { pct, missing } = calcCompletion(profile);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header: avatar(left→edit) + gear(right→settings) ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Pressable
            onPress={() => router.push('/(app)/profile/edit')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}
          >
            {/* Avatar */}
            <View style={{ position: 'relative' }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#3f3f46' }} />
              ) : (
                <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={30} color="#52525b" strokeWidth={1.5} />
                </View>
              )}
              {/* Pen badge */}
              <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#fff', borderRadius: 999, padding: 4, borderWidth: 1.5, borderColor: '#09090b' }}>
                <PenLine size={10} color="#000" strokeWidth={2.5} />
              </View>
            </View>
            {/* Name + edit button */}
            <View>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>{name}</Text>
              <View style={{ marginTop: 6, alignSelf: 'flex-start', backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 4 }}>
                <Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>編輯檔案</Text>
              </View>
            </View>
          </Pressable>

          {/* Gear → settings */}
          <Pressable
            onPress={() => router.push('/(app)/profile/settings')}
            style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#3f3f46' }}
          >
            <Settings size={18} color="#d4d4d8" />
          </Pressable>
        </View>

        {/* ── Progress bar ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 4, marginBottom: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, height: 5, backgroundColor: '#27272a', borderRadius: 3, overflow: 'hidden' }}>
              <View style={{ height: 5, width: `${pct}%`, backgroundColor: '#f97316', borderRadius: 3 }} />
            </View>
            <Text style={{ color: '#f97316', fontSize: 11, fontWeight: '700', minWidth: 32, textAlign: 'right' }}>{pct}%</Text>
          </View>
          <Text style={{ color: '#71717a', fontSize: 12, marginTop: 5 }}>完成你的檔案，讓更多毛孩找到你！</Text>
        </View>

        {/* ── Action cards (missing fields) ── */}
        {missing.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 12, gap: 8 }}>
            {missing.slice(0, 3).map((item) => (
              <Pressable
                key={item.label}
                onPress={() => router.push('/(app)/profile/edit')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#1c1c1e', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#27272a' }}
              >
                <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#52525b' }} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{item.label}</Text>
                  <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }}>{item.hint}</Text>
                </View>
                <ChevronRight size={16} color="#3f3f46" />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Stats ── */}
        <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { label: '配對', value: stats.matches, icon: null },
              { label: '訊息', value: stats.messages, icon: null },
              { label: '肉乾', value: balance, icon: 'plus', onPress: () => setShowTopUp(true) },
            ].map((s) => (
              <Pressable
                key={s.label}
                onPress={s.onPress}
                style={{ flex: 1, borderRadius: 14, borderWidth: 0.5, borderColor: '#27272a', paddingVertical: 14, alignItems: 'center', backgroundColor: '#1c1c1e', position: 'relative' }}
              >
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 26 }}>{s.value}</Text>
                <Text style={{ marginTop: 4, fontFamily: 'monospace', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: '#52525b' }}>{s.label}</Text>
                {s.icon === 'plus' && (
                  <View style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#fff', borderRadius: 999, padding: 3 }}>
                    <Plus size={8} color="#000" strokeWidth={3} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={() => setShowTopUp(true)}
            style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13 }}
          >
            <Beef size={14} color="#000" />
            <Text style={{ color: '#000', fontSize: 13, fontWeight: '700' }}>儲值肉乾 · 立即補貨</Text>
          </Pressable>
        </View>

        {/* ── Footer ── */}
        <Text style={{ marginTop: 32, paddingBottom: 24, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#27272a', textAlign: 'center' }}>
          pawpals go · v1.0
        </Text>

      </ScrollView>

      <TopUpModal open={showTopUp} onClose={() => setShowTopUp(false)} />
    </SafeAreaView>
  );
}
