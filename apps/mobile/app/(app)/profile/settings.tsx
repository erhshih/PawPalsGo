import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, Switch, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { UserDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';
import { disconnectSocket } from '../../../lib/socket';

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 12, fontWeight: '600', color: '#71717a', letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
      {title}
    </Text>
  );
}

function SettingRow({
  label, value, onPress, last,
}: {
  label: string; value?: string; onPress?: () => void; last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 15,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: '#27272a',
      }}
    >
      <Text style={{ fontSize: 15, color: '#e4e4e7' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value ? <Text style={{ fontSize: 14, color: '#71717a' }}>{value}</Text> : null}
        <ChevronRight size={15} color="#3f3f46" />
      </View>
    </Pressable>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
      {children}
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { clearTokens } = useAuthStore();
  const { show } = useToastStore();
  const [profile, setProfile] = useState<UserDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      api.get<UserDto>('/users/me').then(({ data }) => setProfile(data)).catch(() => {});
    }, []),
  );

  async function logout() {
    Alert.alert('登出', '確定要登出嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '登出', style: 'destructive',
        onPress: async () => {
          try { await api.post('/auth/logout'); } catch {}
          disconnectSocket();
          await clearTokens();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  }

  function deleteAccount() {
    Alert.alert('刪除帳號', '此操作無法復原，確定要刪除帳號嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '刪除', style: 'destructive', onPress: () => show('帳號刪除功能即將推出') },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>設定</Text>
        <Pressable onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── 帳號設定 ── */}
        <SectionHeader title="帳號設定" />
        <Card>
          <SettingRow label="電子郵件" value={profile?.email ?? '—'} />
          <SettingRow label="已連結的帳號" onPress={() => show('功能即將推出')} last />
        </Card>

        {/* ── 探索設定 ── */}
        <SectionHeader title="探索設定" />
        <Card>
          <SettingRow
            label="探索設定"
            value="距離、性別、年齡…"
            onPress={() => router.push('/(app)/profile/discover-settings')}
            last
          />
        </Card>

        {/* ── 通知 ── */}
        <SectionHeader title="通知" />
        <Card>
          <SettingRow label="推播通知" onPress={() => show('功能即將推出')} />
          <SettingRow label="電子郵件通知" onPress={() => show('功能即將推出')} last />
        </Card>

        {/* ── 隱私 ── */}
        <SectionHeader title="隱私" />
        <Card>
          <SettingRow label="隱私偏好設定" onPress={() => show('功能即將推出')} />
          <SettingRow label="封鎖名單" onPress={() => router.push('/(app)/profile/blocked')} last />
        </Card>

        {/* ── 法務 ── */}
        <SectionHeader title="法務" />
        <Card>
          <SettingRow label="服務條款" onPress={() => show('功能即將推出')} />
          <SettingRow label="隱私政策" onPress={() => show('功能即將推出')} last />
        </Card>

        {/* ── 登出 ── */}
        <View style={{ marginHorizontal: 16, marginTop: 32 }}>
          <Pressable
            onPress={logout}
            style={{ backgroundColor: '#1c1c1e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#27272a' }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>登出</Text>
          </Pressable>
        </View>

        {/* Version */}
        <Text style={{ textAlign: 'center', color: '#3f3f46', fontSize: 12, marginTop: 20, fontFamily: 'monospace' }}>
          PawPals Go · v1.0.0
        </Text>

        {/* Delete account */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={deleteAccount}
            style={{ backgroundColor: '#1c1c1e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#3f1010' }}
          >
            <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>刪除帳號</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
