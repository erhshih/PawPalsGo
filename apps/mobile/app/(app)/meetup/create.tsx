import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import * as Location from 'expo-location';
import { DogMeetupDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useToastStore } from '../../../stores/toast';

const DAY_OPTIONS = [
  { label: '明天', days: 1 },
  { label: '後天', days: 2 },
  { label: '3 天後', days: 3 },
  { label: '一週後', days: 7 },
];
const HOUR_OPTIONS = [9, 12, 15, 18, 20];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>{label}</Text>
      {children}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
        backgroundColor: active ? '#fff' : '#1c1c1e',
        borderWidth: 0.5, borderColor: active ? '#fff' : '#27272a',
      }}
    >
      <Text style={{ color: active ? '#000' : '#e4e4e7', fontSize: 13, fontWeight: active ? '700' : '400' }}>{label}</Text>
    </Pressable>
  );
}

export default function CreateMeetupScreen() {
  const router = useRouter();
  const { show } = useToastStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [dayIdx, setDayIdx] = useState(0);
  const [hour, setHour] = useState(18);
  const [maxAttendees, setMaxAttendees] = useState('10');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!title.trim() || !location.trim()) { show('請填寫標題與地點'); return; }
    setSubmitting(true);
    try {
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      } catch {}

      const scheduled = new Date();
      scheduled.setDate(scheduled.getDate() + DAY_OPTIONS[dayIdx].days);
      scheduled.setHours(hour, 0, 0, 0);

      const { data } = await api.post<DogMeetupDto>('/dog-meetups', {
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        latitude,
        longitude,
        scheduledAt: scheduled.toISOString(),
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
      });
      router.replace({ pathname: '/(app)/meetup/[meetupId]', params: { meetupId: data.id } });
    } catch {
      show('建立失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>發起狗聚</Text>
        <Pressable onPress={submit} disabled={submitting} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>發布</Text>}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Field label="活動標題">
          <TextInput
            value={title}
            onChangeText={(t) => setTitle(t.slice(0, 60))}
            placeholder="例如：週末河濱公園狗聚"
            placeholderTextColor="#52525b"
            style={{ color: '#fff', fontSize: 15, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14 }}
          />
        </Field>

        <Field label="活動說明（選填）">
          <TextInput
            value={description}
            onChangeText={(t) => setDescription(t.slice(0, 300))}
            placeholder="想約什麼樣的狗聚呢？"
            placeholderTextColor="#52525b"
            multiline
            style={{ color: '#fff', fontSize: 14, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, minHeight: 80, textAlignVertical: 'top' }}
          />
        </Field>

        <Field label="集合地點">
          <TextInput
            value={location}
            onChangeText={(t) => setLocation(t.slice(0, 100))}
            placeholder="例如：大安森林公園"
            placeholderTextColor="#52525b"
            style={{ color: '#fff', fontSize: 15, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14 }}
          />
        </Field>

        <Field label="日期">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DAY_OPTIONS.map((opt, i) => (
              <Chip key={opt.label} label={opt.label} active={dayIdx === i} onPress={() => setDayIdx(i)} />
            ))}
          </View>
        </Field>

        <Field label="時間">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {HOUR_OPTIONS.map((h) => (
              <Chip key={h} label={`${h}:00`} active={hour === h} onPress={() => setHour(h)} />
            ))}
          </View>
        </Field>

        <Field label="人數上限">
          <TextInput
            value={maxAttendees}
            onChangeText={(t) => setMaxAttendees(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            placeholder="10"
            placeholderTextColor="#52525b"
            style={{ color: '#fff', fontSize: 15, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, width: 100 }}
          />
        </Field>
      </ScrollView>
    </SafeAreaView>
  );
}
