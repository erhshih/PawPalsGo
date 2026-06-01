import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Image, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Plus, X, Check, ShieldCheck, ArrowRight } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../lib/api';
import { useToastStore } from '../../stores/toast';

const MAX_PER_CATEGORY = 5;

interface PhotoItem {
  uri: string;
}

function PhotoTile({ uri, isPrimary, onRemove }: { uri: string; isPrimary: boolean; onRemove: () => void }) {
  return (
    <View className="relative rounded-xl overflow-hidden border border-white/30 aspect-[3/4] bg-zinc-900"
      style={{ borderWidth: 0.5 }}>
      <Image source={{ uri }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      <View className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
      {isPrimary && (
        <View className="absolute top-1.5 left-1.5 flex-row items-center gap-1 bg-white rounded-full px-1.5 py-0.5">
          <Check size={9} color="#000" strokeWidth={3} />
          <Text className="text-black text-[8px] font-mono tracking-widest uppercase">主圖</Text>
        </View>
      )}
      <Pressable
        onPress={onRemove}
        className="absolute top-1.5 right-1.5 rounded-full p-1 bg-black/70 border border-white/30"
        style={{ borderWidth: 0.5 }}
      >
        <X size={10} color="#fff" />
      </Pressable>
    </View>
  );
}

function AddTile({ onPick, label }: { onPick: (uri: string) => void; label: string }) {
  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      onPick(result.assets[0].uri);
    }
  }

  return (
    <Pressable
      onPress={handlePick}
      className="rounded-xl border border-dashed border-zinc-700 aspect-[3/4] items-center justify-center gap-1.5 bg-zinc-900/30"
      style={{ borderWidth: 0.5 }}
    >
      <Plus size={16} color="#71717a" strokeWidth={1.5} />
      <Text className="font-mono text-[8px] tracking-widest text-zinc-500">{label}</Text>
    </Pressable>
  );
}

function GhostTile() {
  return (
    <View className="rounded-xl border border-zinc-900 aspect-[3/4] bg-zinc-950/40" style={{ borderWidth: 0.5 }} />
  );
}

function PhotoCategory({
  title, hint, accent, photos, onChange, minRequired,
}: {
  title: string; hint: string; accent: string;
  photos: PhotoItem[]; onChange: (p: PhotoItem[]) => void;
  minRequired: number;
}) {
  const count = photos.length;
  const need = Math.max(0, minRequired - count);
  const canAdd = count < MAX_PER_CATEGORY;

  function remove(i: number) {
    const next = [...photos];
    next.splice(i, 1);
    onChange(next);
  }
  function add(uri: string) {
    if (canAdd) onChange([...photos, { uri }]);
  }

  const tiles = Array.from({ length: MAX_PER_CATEGORY }, (_, i) => {
    if (i < count) return <PhotoTile key={`p-${i}`} uri={photos[i].uri} isPrimary={i === 0} onRemove={() => remove(i)} />;
    if (i === count && canAdd) return <AddTile key="add" onPick={add} label={i === 0 ? '加首張' : '加一張'} />;
    return <GhostTile key={`g-${i}`} />;
  });

  return (
    <View className="mt-5">
      <View className="flex-row items-end justify-between mb-2.5">
        <View>
          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">{accent}</Text>
          <Text className="mt-1 text-[15px] font-semibold text-white leading-tight">{title}</Text>
          <Text className="mt-0.5 text-[11px] text-zinc-500">{hint}</Text>
        </View>
        <View className="items-end">
          <Text className="font-mono text-[10px] tracking-widest text-zinc-400">{count} / {MAX_PER_CATEGORY}</Text>
          {need > 0 && <Text className="font-mono text-[9px] tracking-widest text-white mt-0.5">還差 {need} 張</Text>}
        </View>
      </View>
      <View className="flex-row gap-1.5">{tiles}</View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { role, userId } = useAuthStore();
  const { show } = useToastStore();
  const [loading, setLoading] = useState(false);

  const categories = role === 'OWNER'
    ? [{ key: 'self', title: '你的本人照片', hint: '至少 1 張，最多 5 張', accent: '01 · REQUIRED' }]
    : [
        { key: 'self',    title: '你的本人照片',  hint: '至少 1 張，最多 5 張', accent: '01 · REQUIRED' },
        { key: 'withPet', title: '與毛孩的合照',  hint: '至少 1 張，最多 5 張', accent: '02 · REQUIRED' },
      ];

  const [photos, setPhotos] = useState<Record<string, PhotoItem[]>>(
    Object.fromEntries(categories.map((c) => [c.key, []])),
  );

  const allDone = categories.every((c) => (photos[c.key] ?? []).length >= 1);
  const totalNeed = categories.reduce((n, c) => n + Math.max(0, 1 - (photos[c.key] ?? []).length), 0);

  function setCat(k: string, v: PhotoItem[]) {
    setPhotos((p) => ({ ...p, [k]: v }));
  }

  async function finish() {
    if (!allDone) return;
    setLoading(true);
    try {
      if (role === 'OWNER') {
        // OWNER: create a pet first, then upload photos
        const { data: pet } = await api.post<{ id: string }>('/pets', {
          name: '我的毛孩',
          breed: '待填寫',
          bio: '剛建立的寵物檔案',
          tags: [],
        });
        for (const photo of photos['self'] ?? []) {
          const form = new FormData();
          form.append('file', { uri: photo.uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
          form.append('kind', 'closeup');
          form.append('sortOrder', '0');
          await api.post(`/pets/${pet.id}/photos`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }
      // LOVER: no pet to create, just go to app
      router.replace('/(app)/(tabs)/swipe');
    } catch (err: any) {
      console.log('[Onboarding] Error:', err?.message, err?.response?.data);
      show('照片上傳失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Pressable onPress={() => router.back()} className="p-1.5 -ml-1">
            <ChevronLeft size={18} color="#d4d4d8" />
          </Pressable>
          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
            step 02 · profile
          </Text>
          <View className="w-6" />
        </View>

        <View className="px-5">
          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
            {role === 'OWNER' ? '01 / 飼主' : '02 / 貓狗奴'}
          </Text>
          <Text className="mt-2 text-[24px] font-semibold text-white leading-tight tracking-tight">
            {role === 'OWNER' ? '建立你的人像相簿' : '建立你 · 與毛孩的相簿'}
          </Text>
          <Text className="mt-1.5 text-[12px] text-zinc-400 leading-relaxed">
            {role === 'OWNER'
              ? '至少 1 張本人照片，可上傳至 5 張，第一張為主圖。'
              : '本人照與毛孩合照各至少 1 張，每類最多 5 張，各自第一張為主圖。'}
          </Text>
        </View>

        <View className="px-5">
          {categories.map((c) => (
            <PhotoCategory
              key={c.key}
              title={c.title} hint={c.hint} accent={c.accent}
              photos={photos[c.key] ?? []}
              onChange={(v) => setCat(c.key, v)}
              minRequired={1}
            />
          ))}
        </View>

        {/* Trust badge */}
        <View className="px-5 mt-5">
          <View className="rounded-xl border border-zinc-800 px-3 py-2.5 flex-row items-start gap-2 bg-zinc-900/40"
            style={{ borderWidth: 0.5 }}>
            <ShieldCheck size={14} color="#fff" style={{ marginTop: 2 }} />
            <Text className="flex-1 text-[11px] text-zinc-400 leading-relaxed">
              照片用於人工 + AI 真人驗證。通過後顯示「
              <Text className="text-white">已驗證</Text>
              」徽章；未通過將自動刪除。
            </Text>
          </View>
        </View>

        {/* CTA */}
        <View className="px-5 pb-8 pt-4">
          <Pressable
            onPress={finish}
            disabled={!allDone || loading}
            className={`w-full rounded-2xl py-4 flex-row items-center justify-center gap-2 ${
              allDone && !loading ? 'bg-white' : 'bg-zinc-900 border border-zinc-800'
            }`}
            style={allDone && !loading ? {} : { borderWidth: 0.5 }}
          >
            <Text className={`text-[14px] font-semibold ${allDone && !loading ? 'text-black' : 'text-zinc-600'}`}>
              {loading ? '上傳中…' : allDone ? '進入毛孩世界' : `還差 ${totalNeed} 張必填照片`}
            </Text>
            {allDone && !loading && <ArrowRight size={14} color="#000" />}
          </Pressable>
          <Text className="mt-3 text-center font-mono text-[10px] tracking-widest uppercase text-zinc-600">
            prototype · photos stay in your browser
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
