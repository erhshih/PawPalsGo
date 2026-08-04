import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Clock, Users, User, Ban } from 'lucide-react-native';
import { DogMeetupDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import { useToastStore } from '../../../stores/toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function MeetupDetailScreen() {
  const { meetupId } = useLocalSearchParams<{ meetupId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { show } = useToastStore();
  const [meetup, setMeetup] = useState<DogMeetupDto | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<DogMeetupDto>(`/dog-meetups/${meetupId}`);
      setMeetup(data);
    } catch {}
  }, [meetupId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!meetup) return <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }} />;

  const isOrganizer = meetup.organizerId === userId;
  const joined = meetup.attendees?.some((a) => a.userId === userId) ?? false;
  const cancelled = !!meetup.cancelledAt;
  const full = !!meetup.maxAttendees && meetup.attendeeCount >= meetup.maxAttendees;

  async function join() {
    try {
      await api.post(`/dog-meetups/${meetupId}/join`, {});
      show('已報名參加！', 'success');
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      show(msg === 'MEETUP_FULL' ? '名額已滿' : '報名失敗，請稍後再試');
    }
  }

  function leave() {
    Alert.alert('退出狗聚', '確定要退出這場狗聚嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/dog-meetups/${meetupId}/leave`); load(); } catch { show('操作失敗，請稍後再試'); }
        },
      },
    ]);
  }

  function cancelMeetup() {
    Alert.alert('取消狗聚', '確定要取消這場狗聚嗎？所有參加者都會看到已取消。', [
      { text: '返回', style: 'cancel' },
      {
        text: '取消狗聚', style: 'destructive',
        onPress: async () => {
          try { await api.delete(`/dog-meetups/${meetupId}`); load(); } catch { show('操作失敗，請稍後再試'); }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginRight: 8 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>狗聚詳情</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {cancelled && (
          <View style={{ backgroundColor: '#3f1010', borderRadius: 12, padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ban size={16} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>此狗聚已被取消</Text>
          </View>
        )}

        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{meetup.title}</Text>
        {meetup.description ? (
          <Text style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 20, marginTop: 10 }}>{meetup.description}</Text>
        ) : null}

        <View style={{ marginTop: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Clock size={16} color="#71717a" />
            <Text style={{ color: '#e4e4e7', fontSize: 14 }}>{fmt(meetup.scheduledAt)}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MapPin size={16} color="#71717a" />
            <Text style={{ color: '#e4e4e7', fontSize: 14 }}>{meetup.location}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Users size={16} color="#71717a" />
            <Text style={{ color: '#e4e4e7', fontSize: 14 }}>
              {meetup.attendeeCount}{meetup.maxAttendees ? ` / ${meetup.maxAttendees}` : ''} 人參加
            </Text>
          </View>
        </View>

        <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>參加者</Text>
        <View style={{ gap: 10 }}>
          {(meetup.attendees ?? []).map((a) => {
            const avatarUri = toPhotoUri(a.user?.avatarUrl);
            return (
              <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={14} color="#52525b" />
                  </View>
                )}
                <Text style={{ color: '#e4e4e7', fontSize: 13 }}>
                  {a.user?.displayName || '毛孩爸媽'}{a.userId === meetup.organizerId ? '（發起人）' : ''}
                </Text>
                {a.pet ? <Text style={{ color: '#71717a', fontSize: 12 }}>· 帶 {a.pet.name}</Text> : null}
              </View>
            );
          })}
        </View>

        {!cancelled && (
          <View style={{ marginTop: 28 }}>
            {isOrganizer ? (
              <Pressable onPress={cancelMeetup} style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#3f1010' }}>
                <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>取消狗聚</Text>
              </Pressable>
            ) : joined ? (
              <Pressable onPress={leave} style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a' }}>
                <Text style={{ color: '#e4e4e7', fontSize: 14, fontWeight: '600' }}>退出狗聚</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={join}
                disabled={full}
                style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center', backgroundColor: full ? '#27272a' : '#fff' }}
              >
                <Text style={{ color: full ? '#71717a' : '#000', fontSize: 14, fontWeight: '700' }}>{full ? '名額已滿' : '報名參加'}</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
