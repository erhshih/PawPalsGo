import React, { useState } from 'react';
import {
  View, Text, Pressable, ScrollView, Image, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ChevronLeft, Plus, X, Check, ShieldCheck, ArrowRight, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth';
import { api } from '../../lib/api';
import { useToastStore } from '../../stores/toast';

// ── Data ──────────────────────────────────────────────────────────────────────
const INTEREST_OPTIONS = [
  '遛狗', '貓咪', '咖啡', '旅行', '料理', '閱讀', '健身', '瑜伽',
  '攝影', '音樂', '電影', '設計', '程式', '登山', '游泳', '手作',
  '美食', '藝術', '烘焙', '戶外', '動漫', '語言',
];

const ZODIAC_OPTIONS = [
  '牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座',
  '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座',
];

const MAX_PHOTOS = 5;

// ── Sub-components ────────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {[1, 2, 3].map((s) => (
        <View
          key={s}
          className={`rounded-full ${s === step ? 'bg-white w-4 h-1.5' : s < step ? 'bg-zinc-400 w-1.5 h-1.5' : 'bg-zinc-700 w-1.5 h-1.5'}`}
        />
      ))}
    </View>
  );
}

function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-3 py-1.5 border ${selected ? 'bg-white border-white' : 'border-zinc-700 bg-zinc-900'}`}
      style={{ borderWidth: 0.5 }}
    >
      <Text className={`text-[13px] font-medium ${selected ? 'text-black' : 'text-zinc-400'}`}>{label}</Text>
    </Pressable>
  );
}

function PhotoTile({ uri, isPrimary, onRemove }: { uri: string; isPrimary: boolean; onRemove: () => void }) {
  return (
    <View className="relative rounded-xl overflow-hidden border border-white/30 aspect-[3/4] bg-zinc-900" style={{ borderWidth: 0.5 }}>
      <Image source={{ uri }} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      {isPrimary && (
        <View className="absolute top-1.5 left-1.5 flex-row items-center gap-1 bg-white rounded-full px-1.5 py-0.5">
          <Check size={9} color="#000" strokeWidth={3} />
          <Text className="text-black text-[8px] font-mono tracking-widest uppercase">主圖</Text>
        </View>
      )}
      <Pressable onPress={onRemove} className="absolute top-1.5 right-1.5 rounded-full p-1 bg-black/70 border border-white/30" style={{ borderWidth: 0.5 }}>
        <X size={10} color="#fff" />
      </Pressable>
    </View>
  );
}

function AddTile({ onPick }: { onPick: (uri: string) => void }) {
  async function handlePick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [3, 4], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) onPick(result.assets[0].uri);
  }
  return (
    <Pressable onPress={handlePick} className="rounded-xl border border-dashed border-zinc-700 aspect-[3/4] items-center justify-center gap-1.5 bg-zinc-900/30" style={{ borderWidth: 0.5 }}>
      <Plus size={16} color="#71717a" strokeWidth={1.5} />
      <Text className="font-mono text-[8px] tracking-widest text-zinc-500">加照片</Text>
    </Pressable>
  );
}

function GhostTile() {
  return <View className="rounded-xl border border-zinc-900 aspect-[3/4] bg-zinc-950/40" style={{ borderWidth: 0.5 }} />;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const router = useRouter();
  const { role, userId } = useAuthStore();
  const { show } = useToastStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // Step 2
  const [interests, setInterests] = useState<string[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [height, setHeight] = useState('');
  const [zodiac, setZodiac] = useState('');

  // Step 3
  const [photos, setPhotos] = useState<string[]>([]);

  function toggleInterest(item: string) {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : prev.length < 10 ? [...prev, item] : prev,
    );
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }
  function addPhoto(uri: string) {
    if (photos.length < MAX_PHOTOS) setPhotos((p) => [...p, uri]);
  }

  const canFinish = photos.length >= 1;

  async function finish() {
    if (!canFinish || loading) return;
    setLoading(true);
    try {
      // Save profile info
      const profilePayload: Record<string, unknown> = {};
      if (displayName.trim()) profilePayload.displayName = displayName.trim();
      if (bio.trim()) profilePayload.bio = bio.trim();
      if (interests.length > 0) profilePayload.interests = interests;
      if (jobTitle.trim()) profilePayload.jobTitle = jobTitle.trim();
      if (height && !isNaN(Number(height))) profilePayload.height = Number(height);
      if (zodiac) profilePayload.zodiac = zodiac;

      if (Object.keys(profilePayload).length > 0) {
        await api.patch('/users/me', profilePayload);
      }

      // Upload avatar (first photo)
      const avatarForm = new FormData();
      avatarForm.append('file', { uri: photos[0], name: 'avatar.jpg', type: 'image/jpeg' } as any);
      await api.post('/users/me/avatar', avatarForm, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (role === 'OWNER') {
        // Create placeholder pet
        const { data: pet } = await api.post<{ id: string }>('/pets', {
          name: '我的毛孩', breed: '待填寫', bio: '剛建立的寵物檔案', tags: [],
        });
        // Upload remaining photos as pet photos
        for (let i = 1; i < photos.length; i++) {
          const form = new FormData();
          form.append('file', { uri: photos[i], name: 'photo.jpg', type: 'image/jpeg' } as any);
          form.append('kind', 'closeup');
          form.append('sortOrder', String(i));
          await api.post(`/pets/${pet.id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
      }

      router.replace('/(app)/(tabs)/swipe');
    } catch (err: any) {
      console.log('[Onboarding] Error:', err?.message, err?.response?.data);
      show('上傳失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
          <Pressable
            onPress={() => step > 1 ? setStep(step - 1) : router.back()}
            className="p-1.5 -ml-1"
          >
            <ChevronLeft size={18} color="#d4d4d8" />
          </Pressable>
          <StepDots step={step} />
          <View className="w-6" />
        </View>

        {/* ── Step 1: 基本介紹 ─────────────────────────────────────────── */}
        {step === 1 && (
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="px-5 mt-4">
              <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 01 · 基本介紹</Text>
              <Text className="mt-2 text-[24px] font-semibold text-white tracking-tight leading-tight">
                你想讓大家{'\n'}怎麼認識你？
              </Text>
              <Text className="mt-2 text-[13px] text-zinc-500">這些資料會顯示在你的配對卡上</Text>

              <View className="mt-8">
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">顯示名稱</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="例如：小薇、阿明、Cathy..."
                  placeholderTextColor="#52525b"
                  maxLength={30}
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5 }}
                />
              </View>

              <View className="mt-5">
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">個人簡介</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="分享你的故事、個性、或是你和毛孩的日常..."
                  placeholderTextColor="#52525b"
                  multiline
                  numberOfLines={4}
                  maxLength={300}
                  textAlignVertical="top"
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5, minHeight: 100 }}
                />
                <Text className="mt-1 text-right text-[11px] text-zinc-600">{bio.length}/300</Text>
              </View>

              <Pressable
                onPress={() => { if (displayName.trim()) setStep(2); }}
                disabled={!displayName.trim()}
                className={`mt-8 mb-8 rounded-2xl py-4 items-center ${displayName.trim() ? 'bg-white' : 'bg-zinc-900 border border-zinc-800'}`}
                style={displayName.trim() ? {} : { borderWidth: 0.5 }}
              >
                <Text className={`text-[14px] font-semibold ${displayName.trim() ? 'text-black' : 'text-zinc-600'}`}>
                  繼續
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* ── Step 2: 興趣 & 資訊 ─────────────────────────────────────── */}
        {step === 2 && (
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            <View className="px-5 mt-4">
              <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 02 · 興趣 & 資訊</Text>
              <Text className="mt-2 text-[24px] font-semibold text-white tracking-tight leading-tight">
                讓大家更了解你
              </Text>

              {/* Interests */}
              <View className="mt-6">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">興趣（最多選 10 個）</Text>
                  <Text className="font-mono text-[10px] text-zinc-500">{interests.length}/10</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((item) => (
                    <Chip key={item} label={item} selected={interests.includes(item)} onPress={() => toggleInterest(item)} />
                  ))}
                </View>
              </View>

              {/* Job title */}
              <View className="mt-6">
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">職稱</Text>
                <TextInput
                  value={jobTitle}
                  onChangeText={setJobTitle}
                  placeholder="例如：軟體工程師、設計師、學生..."
                  placeholderTextColor="#52525b"
                  maxLength={50}
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5 }}
                />
              </View>

              {/* Height */}
              <View className="mt-4">
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">身高（cm）</Text>
                <TextInput
                  value={height}
                  onChangeText={(v) => setHeight(v.replace(/[^0-9]/g, ''))}
                  placeholder="例如：170"
                  placeholderTextColor="#52525b"
                  keyboardType="number-pad"
                  maxLength={3}
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5 }}
                />
              </View>

              {/* Zodiac */}
              <View className="mt-4">
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2.5">星座</Text>
                <View className="flex-row flex-wrap gap-2">
                  {ZODIAC_OPTIONS.map((z) => (
                    <Chip key={z} label={z} selected={zodiac === z} onPress={() => setZodiac(zodiac === z ? '' : z)} />
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => setStep(3)}
                className="mt-8 mb-8 rounded-2xl py-4 items-center bg-white"
              >
                <Text className="text-[14px] font-semibold text-black">
                  {interests.length > 0 || jobTitle.trim() ? '繼續' : '跳過，稍後填寫'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        )}

        {/* ── Step 3: 照片 ─────────────────────────────────────────────── */}
        {step === 3 && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-5 mt-4">
              <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 03 · 照片</Text>
              <Text className="mt-2 text-[24px] font-semibold text-white tracking-tight leading-tight">
                {role === 'OWNER' ? '加上你的本人照片' : '你 · 與毛孩的照片'}
              </Text>
              <Text className="mt-1.5 text-[12px] text-zinc-400 leading-relaxed">
                {role === 'OWNER'
                  ? '至少 1 張本人照，最多 5 張，第一張為主圖。'
                  : '至少 1 張本人照或與毛孩的合照，最多 5 張。'}
              </Text>

              {/* Photo grid */}
              <View className="mt-5 flex-row gap-1.5">
                {Array.from({ length: MAX_PHOTOS }, (_, i) => {
                  if (i < photos.length) return <PhotoTile key={i} uri={photos[i]} isPrimary={i === 0} onRemove={() => removePhoto(i)} />;
                  if (i === photos.length && photos.length < MAX_PHOTOS) return <AddTile key="add" onPick={addPhoto} />;
                  return <GhostTile key={i} />;
                })}
              </View>

              {/* Trust badge */}
              <View className="mt-5 rounded-xl border border-zinc-800 px-3 py-2.5 flex-row items-start gap-2 bg-zinc-900/40" style={{ borderWidth: 0.5 }}>
                <ShieldCheck size={14} color="#fff" style={{ marginTop: 2 }} />
                <Text className="flex-1 text-[11px] text-zinc-400 leading-relaxed">
                  照片用於真人驗證，通過後顯示「<Text className="text-white">已驗證</Text>」徽章。
                </Text>
              </View>

              <Pressable
                onPress={finish}
                disabled={!canFinish || loading}
                className={`mt-5 mb-8 w-full rounded-2xl py-4 flex-row items-center justify-center gap-2 ${canFinish && !loading ? 'bg-white' : 'bg-zinc-900 border border-zinc-800'}`}
                style={canFinish && !loading ? {} : { borderWidth: 0.5 }}
              >
                <Text className={`text-[14px] font-semibold ${canFinish && !loading ? 'text-black' : 'text-zinc-600'}`}>
                  {loading ? '上傳中…' : canFinish ? '進入毛孩世界' : '請至少上傳 1 張照片'}
                </Text>
                {canFinish && !loading && <ArrowRight size={14} color="#000" />}
              </Pressable>
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
