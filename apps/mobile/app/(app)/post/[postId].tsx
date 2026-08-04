import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Modal, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Beef, User, Flag, Trash2, Send, Users as UsersIcon } from 'lucide-react-native';
import { PostDto, PostCommentDto, TipperDto, TIP_AMOUNTS } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../stores/auth';
import { useWalletStore } from '../../../stores/wallet';
import { useToastStore } from '../../../stores/toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function TipModal({ open, onClose, onTip }: { open: boolean; onClose: () => void; onTip: (amount: number) => void }) {
  if (!open) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }} onPress={onClose}>
        <View
          style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 0.5, borderColor: '#27272a' }}
          onStartShouldSetResponder={() => true}
        >
          <View style={{ width: 40, height: 4, backgroundColor: '#3f3f46', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <View style={{ borderRadius: 999, backgroundColor: '#d4d4d8', padding: 10 }}>
              <Beef size={18} color="#18181b" />
            </View>
            <View>
              <Text style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: '#71717a' }}>tip this post</Text>
              <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>抖內肉乾給這則貼文</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {TIP_AMOUNTS.map((amt) => (
              <Pressable
                key={amt}
                onPress={() => onTip(amt)}
                style={{ flexBasis: '47%', borderRadius: 14, borderWidth: 0.5, borderColor: '#27272a', backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{amt} 🦴</Text>
              </Pressable>
            ))}
          </View>
          <Text style={{ marginTop: 14, fontSize: 12, color: '#71717a', textAlign: 'center' }}>抖內後，貼文作者會看到你的個人介紹</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { balance, setBalance, deductBalance } = useWalletStore();
  const { show } = useToastStore();

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [tippers, setTippers] = useState<TipperDto[] | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<PostDto>(`/posts/${postId}`);
      setPost(data);
    } catch {}
    try {
      const { data } = await api.get<PostCommentDto[]>(`/posts/${postId}/comments`);
      setComments(data);
    } catch {}
  }, [postId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const isAuthor = post && userId === post.authorId;

  async function toggleLike() {
    if (!post) return;
    try {
      if (liked) {
        await api.delete(`/posts/${postId}/like`);
        setPost({ ...post, likeCount: Math.max(0, post.likeCount - 1) });
      } else {
        await api.post(`/posts/${postId}/like`);
        setPost({ ...post, likeCount: post.likeCount + 1 });
      }
      setLiked(!liked);
    } catch {}
  }

  async function submitComment() {
    if (!commentText.trim() || !post) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      const { data } = await api.post<PostCommentDto>(`/posts/${postId}/comments`, { text });
      setComments((c) => [data, ...c]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch {
      show('留言失敗，請稍後再試');
    }
  }

  async function tip(amount: number) {
    if (!post) return;
    if (balance < amount) { show('肉乾不足，請先儲值'); setShowTip(false); return; }
    try {
      await api.post(`/posts/${postId}/tip`, { amount });
      deductBalance(amount);
      setPost({ ...post, tipCount: post.tipCount + 1 });
      setShowTip(false);
      show(`🦴 已抖內 ${amount} 塊肉乾！`, 'success');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      show(msg === 'CANNOT_TIP_OWN_POST' ? '不能抖內自己的貼文' : '抖內失敗，請稍後再試');
      setShowTip(false);
    }
  }

  async function loadTippers() {
    try {
      const { data } = await api.get<TipperDto[]>(`/posts/${postId}/tippers`);
      setTippers(data);
    } catch {
      show('無法讀取打賞名單');
    }
  }

  function deletePost() {
    Alert.alert('刪除貼文', '確定要刪除這則貼文嗎？', [
      { text: '取消', style: 'cancel' },
      {
        text: '刪除', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/posts/${postId}`);
            router.back();
          } catch { show('刪除失敗，請稍後再試'); }
        },
      },
    ]);
  }

  function reportPost() {
    if (!post) return;
    router.push({
      pathname: '/(app)/report/create',
      params: { targetId: post.authorId, postId: post.id },
    });
  }

  if (!post) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }} />
    );
  }

  const avatarUri = toPhotoUri(post.author?.avatarUrl);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>貼文</Text>
        <Pressable onPress={isAuthor ? deletePost : reportPost} style={{ padding: 6 }}>
          {isAuthor ? <Trash2 size={18} color="#ef4444" /> : <Flag size={18} color="#d4d4d8" />}
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 }}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="#52525b" />
              </View>
            )}
            <View>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{post.author?.displayName || '毛孩爸媽'}</Text>
              <Text style={{ color: '#71717a', fontSize: 11, marginTop: 1 }}>{post.author?.city || ''}</Text>
            </View>
          </View>

          {post.photos?.length > 0 && (
            <FlatList
              data={post.photos}
              horizontal
              pagingEnabled
              keyExtractor={(p) => p.id}
              renderItem={({ item }) => (
                <Image source={{ uri: toPhotoUri(item.url)! }} style={{ width: 390, height: 390 }} resizeMode="cover" />
              )}
              showsHorizontalScrollIndicator={false}
            />
          )}

          {post.caption ? (
            <Text style={{ color: '#e4e4e7', fontSize: 14, lineHeight: 20, paddingHorizontal: 16, paddingTop: 14 }}>
              {post.caption}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, padding: 16 }}>
            <Pressable onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Heart size={20} color={liked ? '#ef4444' : '#a1a1aa'} fill={liked ? '#ef4444' : 'transparent'} />
              <Text style={{ color: '#a1a1aa', fontSize: 13 }}>{post.likeCount}</Text>
            </Pressable>
            <Pressable onPress={() => setShowTip(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Beef size={20} color="#f97316" />
              <Text style={{ color: '#f97316', fontSize: 13 }}>抖內 {post.tipCount > 0 ? `(${post.tipCount})` : ''}</Text>
            </Pressable>
            {isAuthor && (
              <Pressable onPress={loadTippers} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <UsersIcon size={18} color="#a1a1aa" />
                <Text style={{ color: '#a1a1aa', fontSize: 13 }}>打賞名單</Text>
              </Pressable>
            )}
          </View>

          {tippers && (
            <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1c1c1e', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#27272a' }}>
              <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>打賞名單 · 個人介紹已解鎖</Text>
              {tippers.length === 0 ? (
                <Text style={{ color: '#52525b', fontSize: 13 }}>還沒有人抖內</Text>
              ) : (
                tippers.map((t, i) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t.sender.displayName || t.sender.email}</Text>
                      {t.sender.bio ? <Text style={{ color: '#71717a', fontSize: 12, marginTop: 2 }} numberOfLines={2}>{t.sender.bio}</Text> : null}
                    </View>
                    <Text style={{ color: '#f97316', fontSize: 13, fontWeight: '600' }}>{t.amount} 🦴</Text>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ borderTopWidth: 0.5, borderTopColor: '#1c1c1e', paddingTop: 12 }}>
            <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 }}>
              留言 {comments.length > 0 ? `(${comments.length})` : ''}
            </Text>
            {comments.length === 0 ? (
              <Text style={{ color: '#52525b', fontSize: 13, paddingHorizontal: 16 }}>還沒有留言</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                  <Text style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 18 }}>{c.text}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 0.5, borderTopColor: '#1c1c1e' }}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="留言..."
            placeholderTextColor="#52525b"
            style={{ flex: 1, backgroundColor: '#1c1c1e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 }}
          />
          <Pressable onPress={submitComment} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Send size={16} color="#000" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <TipModal open={showTip} onClose={() => setShowTip(false)} onTip={tip} />
    </SafeAreaView>
  );
}
