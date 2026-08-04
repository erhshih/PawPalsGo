import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Image, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, MessageCircle, Beef, Plus, PawPrint, User } from 'lucide-react-native';
import { PostDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useDiscoverPrefs } from '../../../stores/discoverPrefs';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function distLabel(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function PostCard({ post, onPress }: { post: PostDto; onPress: () => void }) {
  const cover = post.photos?.[0]?.url;
  const coverUri = toPhotoUri(cover);
  const name = post.author?.displayName || '毛孩爸媽';
  const avatarUri = toPhotoUri(post.author?.avatarUrl);

  return (
    <Pressable
      onPress={onPress}
      style={{ marginHorizontal: 16, marginBottom: 14, borderRadius: 18, backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a', overflow: 'hidden' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={{ width: 34, height: 34, borderRadius: 17 }} />
        ) : (
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color="#52525b" />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{name}</Text>
          <Text style={{ color: '#71717a', fontSize: 11, marginTop: 1 }}>
            {[post.author?.city, distLabel(post.distanceM)].filter(Boolean).join(' · ') || '附近'}
          </Text>
        </View>
      </View>

      {coverUri && (
        <Image source={{ uri: coverUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
      )}

      {post.caption ? (
        <Text style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 19, paddingHorizontal: 14, paddingTop: 10 }} numberOfLines={3}>
          {post.caption}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 14, paddingTop: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Heart size={15} color="#71717a" />
          <Text style={{ color: '#71717a', fontSize: 12 }}>{post.likeCount}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <MessageCircle size={15} color="#71717a" />
          <Text style={{ color: '#71717a', fontSize: 12 }}>{post.commentCount}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Beef size={15} color="#f97316" />
          <Text style={{ color: '#f97316', fontSize: 12 }}>{post.tipCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { radius } = useDiscoverPrefs();
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PostDto[]>('/posts/feed', { params: { radius: Math.min(radius, 50), limit: 30 } });
      setPosts(data);
    } catch {}
    setLoaded(true);
  }, [radius]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>動態</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => router.push('/(app)/meetup')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#1c1c1e', alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#27272a' }}
          >
            <PawPrint size={16} color="#d4d4d8" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(app)/post/create')}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}
          >
            <Plus size={18} color="#000" strokeWidth={2.5} />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => router.push({ pathname: '/(app)/post/[postId]', params: { postId: item.id } })} />
        )}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
        refreshControl={<RefreshControl tintColor="#71717a" refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 100 }}>
              <Text style={{ color: '#71717a', fontSize: 14 }}>附近還沒有貼文</Text>
              <Text style={{ color: '#52525b', fontSize: 12, marginTop: 6 }}>當第一個分享毛孩日常的人吧！</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
