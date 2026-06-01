import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MatchDto, MessageDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { connectSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../stores/auth';
import { useUnreadStore } from '../../../stores/unread';

export default function ChatListScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchDto[]>([]);
  const { userId } = useAuthStore();
  const { perMatch, setAll, increment } = useUnreadStore();

  // 首次載入：抓配對列表，初始化 store 的未讀數
  useEffect(() => {
    api.get<MatchDto[]>('/matches')
      .then(({ data }) => {
        setMatches(data);
        setAll(data.map((m) => ({ matchId: m.id, count: m.unreadCount })));
      })
      .catch(() => {});
  }, []);

  // 加入所有配對房間，即時監聽新訊息
  useEffect(() => {
    if (matches.length === 0) return;
    let mounted = true;

    connectSocket().then((socket) => {
      if (!mounted) return;
      matches.forEach((m) => socket.emit('chat:join', { matchId: m.id }));

      socket.on('chat:message', (msg: MessageDto) => {
        if (msg.senderId === userId) return;
        setMatches((prev) =>
          prev.map((m) =>
            m.id === msg.matchId ? { ...m, lastMessage: msg } : m,
          ),
        );
        increment(msg.matchId);
      });
    });

    return () => {
      mounted = false;
      connectSocket().then((socket) => socket.off('chat:message'));
    };
  }, [matches.length, userId]);

  const totalUnread = Object.values(perMatch).reduce((s, n) => s + n, 0);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <View className="px-5 pt-3 pb-4">
        <Text className="text-[17px] font-semibold text-white tracking-tight">訊息</Text>
      </View>
      <FlatList
        data={matches}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => {
          const unread = perMatch[item.id] ?? 0;
          return (
            <Pressable
              onPress={() => router.push({ pathname: '/(app)/chat/[matchId]', params: { matchId: item.id } })}
              className="flex-row items-center px-5 py-4 border-b border-zinc-800 active:bg-zinc-900/50"
              style={{ borderBottomWidth: 0.5 }}
            >
              <View className="h-12 w-12 rounded-full bg-zinc-800 items-center justify-center mr-3">
                <Text className="text-white text-[18px]">🐾</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-[14px] font-medium">{item.partner?.email ?? '配對對象'}</Text>
                {item.lastMessage && (
                  <Text className="text-zinc-500 text-[12px] mt-0.5" numberOfLines={1}>
                    {item.lastMessage.text}
                  </Text>
                )}
              </View>
              {unread > 0 && (
                <View className="rounded-full bg-white h-5 w-5 items-center justify-center">
                  <Text className="text-black text-[10px] font-semibold">{unread}</Text>
                </View>
              )}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-32">
            <Text className="text-zinc-600 text-[14px]">還沒有配對訊息</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
