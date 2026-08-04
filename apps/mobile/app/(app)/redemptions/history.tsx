import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Ticket } from 'lucide-react-native';
import { RedemptionDto } from '@pawpals/shared';
import { api } from '../../../lib/api';

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RedemptionHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<RedemptionDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      api.get<RedemptionDto[]>('/redemptions/history').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoaded(true));
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6, marginRight: 8 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>兌換紀錄</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 16, backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a', padding: 16 }}>
            <Text style={{ color: '#71717a', fontSize: 11 }}>{item.reward?.partnerName}</Text>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginTop: 4 }}>{item.reward?.title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: '#000', borderRadius: 10, padding: 12 }}>
              <Ticket size={16} color="#f97316" />
              <Text style={{ color: '#f97316', fontSize: 16, fontWeight: '700', letterSpacing: 1 }}>{item.code}</Text>
            </View>
            <Text style={{ color: '#52525b', fontSize: 11, marginTop: 8 }}>兌換於 {fmt(item.redeemedAt)}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ color: '#71717a', fontSize: 14 }}>還沒有兌換紀錄</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
