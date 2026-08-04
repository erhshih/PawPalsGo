import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Plus, MapPin, Users, Clock } from 'lucide-react-native';
import { DogMeetupDto } from '@pawpals/shared';
import { api } from '../../../lib/api';

function fmt(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function distLabel(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function MeetupCard({ meetup, onPress }: { meetup: DogMeetupDto; onPress: () => void }) {
  const full = !!meetup.maxAttendees && meetup.attendeeCount >= meetup.maxAttendees;
  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 16, backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a', padding: 16 }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }}>{meetup.title}</Text>
        {full && (
          <View style={{ backgroundColor: '#27272a', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 10 }}>已額滿</Text>
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
        <Clock size={12} color="#71717a" />
        <Text style={{ color: '#a1a1aa', fontSize: 12 }}>{fmt(meetup.scheduledAt)}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
        <MapPin size={12} color="#71717a" />
        <Text style={{ color: '#a1a1aa', fontSize: 12 }} numberOfLines={1}>
          {meetup.location}{distLabel(meetup.distanceM) ? ` · ${distLabel(meetup.distanceM)}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }}>
        <Users size={12} color="#71717a" />
        <Text style={{ color: '#a1a1aa', fontSize: 12 }}>
          {meetup.attendeeCount}{meetup.maxAttendees ? ` / ${meetup.maxAttendees}` : ''} 人參加
        </Text>
      </View>
    </Pressable>
  );
}

export default function MeetupListScreen() {
  const router = useRouter();
  const [meetups, setMeetups] = useState<DogMeetupDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<DogMeetupDto[]>('/dog-meetups/nearby', { params: { radius: 50, limit: 30 } });
      setMeetups(data);
    } catch {}
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>狗聚</Text>
        <Pressable onPress={() => router.push('/(app)/meetup/create')} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Plus size={16} color="#000" strokeWidth={2.5} />
        </Pressable>
      </View>

      <FlatList
        data={meetups}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MeetupCard meetup={item} onPress={() => router.push({ pathname: '/(app)/meetup/[meetupId]', params: { meetupId: item.id } })} />
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl tintColor="#71717a" refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ color: '#71717a', fontSize: 14 }}>附近還沒有狗聚活動</Text>
              <Text style={{ color: '#52525b', fontSize: 12, marginTop: 6 }}>發起一場，約大家出來遛狗吧！</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
