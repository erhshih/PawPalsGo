import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { PostDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useToastStore } from '../../../stores/toast';

export default function CreatePostScreen() {
  const router = useRouter();
  const { show } = useToastStore();
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { show('請在設定中允許存取相片庫'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [4, 3], quality: 0.85,
    });
    if (result.canceled) return;
    setPhotoUri(result.assets[0].uri);
  }

  async function submit() {
    if (!caption.trim() && !photoUri) { show('請至少輸入文字或選擇照片'); return; }
    setSubmitting(true);
    try {
      const { data: post } = await api.post<PostDto>('/posts', { caption: caption.trim() || undefined });
      if (photoUri) {
        const form = new FormData();
        form.append('file', { uri: photoUri, type: 'image/jpeg', name: 'post.jpg' } as any);
        await api.post(`/posts/${post.id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      router.back();
    } catch {
      show('發布失敗，請稍後再試');
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
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>新貼文</Text>
        <Pressable onPress={submit} disabled={submitting} style={{ paddingHorizontal: 6, paddingVertical: 4 }}>
          {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>發布</Text>}
        </Pressable>
      </View>

      <View style={{ padding: 16 }}>
        <TextInput
          value={caption}
          onChangeText={(t) => setCaption(t.slice(0, 300))}
          placeholder="分享你和毛孩的日常..."
          placeholderTextColor="#52525b"
          multiline
          style={{ color: '#fff', fontSize: 15, lineHeight: 22, minHeight: 100, textAlignVertical: 'top' }}
        />
        <Text style={{ color: '#52525b', fontSize: 11, textAlign: 'right', marginBottom: 16 }}>{caption.length}/300</Text>

        {photoUri ? (
          <Pressable onPress={pickPhoto} style={{ borderRadius: 16, overflow: 'hidden' }}>
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: 260 }} resizeMode="cover" />
          </Pressable>
        ) : (
          <Pressable
            onPress={pickPhoto}
            style={{ borderRadius: 16, borderWidth: 0.5, borderColor: '#27272a', borderStyle: 'dashed', paddingVertical: 40, alignItems: 'center', gap: 8, backgroundColor: '#1c1c1e' }}
          >
            <ImagePlus size={22} color="#71717a" />
            <Text style={{ color: '#71717a', fontSize: 13 }}>新增一張照片（選填）</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}
