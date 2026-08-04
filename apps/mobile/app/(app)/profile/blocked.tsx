import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, User, Ban } from 'lucide-react-native';
import { BlockedEntryDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useToastStore } from '../../../stores/toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function BlockedListScreen() {
  const router = useRouter();
  const { show } = useToastStore();
  const [items, setItems] = useState<BlockedEntryDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(() => {
    api.get<BlockedEntryDto[]>('/blocks').then(({ data }) => setItems(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function unblock(userId: string, name: string) {
    Alert.alert('解除封鎖', `確定要解除封鎖「${name}」嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '解除封鎖',
        onPress: async () => {
          try {
            await api.delete(`/blocks/${userId}`);
            setItems((prev) => prev.filter((i) => i.user.id !== userId));
            show('已解除封鎖', 'success');
          } catch { show('操作失敗，請稍後再試'); }
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
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>封鎖名單</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.user.id}
        renderItem={({ item }) => {
          const avatarUri = toPhotoUri(item.user.avatarUrl);
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={18} color="#52525b" />
                </View>
              )}
              <Text style={{ flex: 1, marginLeft: 12, color: '#fff', fontSize: 14 }}>{item.user.displayName || '使用者'}</Text>
              <Pressable
                onPress={() => unblock(item.user.id, item.user.displayName || '此使用者')}
                style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a' }}
              >
                <Text style={{ color: '#e4e4e7', fontSize: 12, fontWeight: '600' }}>解除封鎖</Text>
              </Pressable>
            </View>
          );
        }}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ban size={28} color="#3f3f46" />
              <Text style={{ color: '#71717a', fontSize: 14, marginTop: 10 }}>還沒有封鎖任何人</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
