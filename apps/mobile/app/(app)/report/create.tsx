import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { ReportReason } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useToastStore } from '../../../stores/toast';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: '騷擾或霸凌' },
  { value: 'FAKE_PROFILE', label: '假帳號 / 冒充他人' },
  { value: 'INAPPROPRIATE_CONTENT', label: '不當內容' },
  { value: 'SCAM', label: '詐騙' },
  { value: 'SPAM', label: '垃圾訊息' },
  { value: 'OTHER', label: '其他' },
];

export default function CreateReportScreen() {
  const { targetId, postId } = useLocalSearchParams<{ targetId: string; postId?: string }>();
  const router = useRouter();
  const { show } = useToastStore();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!reason) { show('請選擇檢舉原因'); return; }
    setSubmitting(true);
    try {
      await api.post('/reports', { targetId, reason, detail: detail.trim() || undefined, postId: postId || undefined });
      Alert.alert('已送出檢舉', '我們會盡快審核，感謝你協助維護社群安全。', [
        { text: '確定', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      show(msg === 'CANNOT_REPORT_SELF' ? '無法檢舉自己' : '送出失敗，請稍後再試');
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
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>檢舉</Text>
        <Pressable onPress={submit} disabled={submitting} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>送出</Text>}
        </Pressable>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>檢舉原因</Text>
        <View style={{ gap: 8 }}>
          {REASONS.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setReason(r.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderRadius: 12, padding: 14,
                backgroundColor: reason === r.value ? '#fff' : '#1c1c1e',
                borderWidth: 0.5, borderColor: reason === r.value ? '#fff' : '#27272a',
              }}
            >
              <Text style={{ color: reason === r.value ? '#000' : '#e4e4e7', fontSize: 14, fontWeight: reason === r.value ? '700' : '400' }}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginTop: 24, marginBottom: 10 }}>補充說明（選填）</Text>
        <TextInput
          value={detail}
          onChangeText={(t) => setDetail(t.slice(0, 500))}
          placeholder="請描述發生的狀況..."
          placeholderTextColor="#52525b"
          multiline
          style={{ color: '#fff', fontSize: 14, backgroundColor: '#1c1c1e', borderRadius: 12, padding: 14, minHeight: 100, textAlignVertical: 'top' }}
        />
      </View>
    </SafeAreaView>
  );
}
