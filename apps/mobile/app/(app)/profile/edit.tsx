import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, Image,
  Modal, ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Camera, ChevronRight, MapPin, Briefcase, GraduationCap, Star, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Gender, UserDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useToastStore } from '../../../stores/toast';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

const { width: SW } = Dimensions.get('window');
const PHOTO_PAD = 16;
const PHOTO_GAP = 4;
const SLOT_W = (SW - PHOTO_PAD * 2 - PHOTO_GAP * 2) / 3;
const SLOT_H = SLOT_W * 1.4;

const INTERESTS = [
  { key: '貓咪', emoji: '🐱' }, { key: '狗狗', emoji: '🐶' }, { key: '兔子', emoji: '🐰' },
  { key: '倉鼠', emoji: '🐹' }, { key: '鳥類', emoji: '🐦' }, { key: '爬蟲', emoji: '🦎' },
  { key: '露營', emoji: '⛺' }, { key: '健行', emoji: '🥾' }, { key: '瑜珈', emoji: '🧘' },
  { key: '跑步', emoji: '🏃' }, { key: '游泳', emoji: '🏊' }, { key: '騎車', emoji: '🚴' },
  { key: '旅行', emoji: '✈️' }, { key: '攝影', emoji: '📸' }, { key: '烹飪', emoji: '🍳' },
  { key: '美食', emoji: '🍜' }, { key: '咖啡', emoji: '☕' }, { key: '音樂', emoji: '🎵' },
  { key: '電影', emoji: '🎬' }, { key: '閱讀', emoji: '📚' }, { key: '設計', emoji: '🎨' },
  { key: '電玩', emoji: '🎮' }, { key: '動漫', emoji: '🎌' }, { key: '桌遊', emoji: '♟️' },
  { key: '志工', emoji: '🤝' }, { key: '健身', emoji: '💪' }, { key: '戶外', emoji: '🌿' },
  { key: '公益', emoji: '💚' }, { key: '寵物美容', emoji: '✂️' }, { key: '動物訓練', emoji: '🦮' },
];
const ZODIACS = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
const EDUCATIONS = ['高中', '大學', '碩士', '博士', '其他'];
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'MALE', label: '男' }, { key: 'FEMALE', label: '女' }, { key: 'OTHER', label: '多元' },
];
const GENDER_LABEL: Record<Gender, string> = { MALE: '男性', FEMALE: '女性', OTHER: '多元性別' };

type FieldKey = 'name' | 'bio' | 'passions' | 'gender' | 'zodiac' | 'city' | 'jobTitle' | 'company' | 'school' | 'education' | 'height';

// ── PhotoSlot ──────────────────────────────────────────────────────────────────
function PhotoSlot({ uri, onPress, uploading }: { uri: string | null; onPress: () => void; uploading?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: SLOT_W, height: SLOT_H, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a' }}
    >
      {uri ? (
        <>
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, padding: 5 }}>
            <Camera size={11} color="#fff" />
          </View>
          <View style={{ position: 'absolute', top: 5, right: 5, backgroundColor: '#000', borderRadius: 999, width: 20, height: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3f3f46' }}>
            <X size={10} color="#fff" strokeWidth={2.5} />
          </View>
        </>
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: '#3f3f46', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#52525b', fontSize: 16, lineHeight: 20 }}>+</Text>
          </View>
        </View>
      )}
      {uploading && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
    </Pressable>
  );
}

// ── FieldSheet ─────────────────────────────────────────────────────────────────
function FieldSheet({ visible, title, onClose, onSave, children }: {
  visible: boolean; title: string; onClose: () => void; onSave?: () => void; children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{ backgroundColor: '#18181b', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 }}>
          <View style={{ width: 40, height: 4, backgroundColor: '#3f3f46', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 }}>
            <Pressable onPress={onClose} style={{ padding: 4 }}>
              <X size={18} color="#71717a" />
            </Pressable>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{title}</Text>
            {onSave ? (
              <Pressable onPress={onSave} style={{ padding: 4 }}>
                <Check size={18} color="#fff" />
              </Pressable>
            ) : <View style={{ width: 26 }} />}
          </View>
          <View style={{ height: 0.5, backgroundColor: '#27272a' }} />
          <View style={{ padding: 20 }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

// ── SectionLabel ───────────────────────────────────────────────────────────────
function SectionLabel({ title, badge }: { title: string; badge?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{title}</Text>
      {badge && (
        <View style={{ backgroundColor: '#f97316', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{badge}</Text>
        </View>
      )}
    </View>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────────
function InfoRow({ label, value, onPress, last }: {
  label: string; value?: string; onPress: () => void; last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, paddingHorizontal: 20,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: '#27272a',
      }}
    >
      <Text style={{ fontSize: 15, color: '#e4e4e7' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontSize: 14, color: value ? '#71717a' : '#3f3f46' }}>{value || '新增'}</Text>
        <ChevronRight size={15} color="#3f3f46" />
      </View>
    </Pressable>
  );
}

// ── Chip ───────────────────────────────────────────────────────────────────────
function Chip({ label, emoji, selected, disabled, onPress }: {
  label: string; emoji?: string; selected: boolean; disabled?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
        borderColor: selected ? '#fff' : '#3f3f46',
        backgroundColor: selected ? '#fff' : 'transparent',
        opacity: disabled ? 0.35 : 1,
        marginBottom: 8, marginRight: 8,
      }}
    >
      {emoji && <Text style={{ fontSize: 14 }}>{emoji}</Text>}
      <Text style={{ fontSize: 13, fontWeight: '500', color: selected ? '#000' : '#d4d4d8' }}>{label}</Text>
    </Pressable>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function EditProfileScreen() {
  const router = useRouter();
  const { show } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [nameError, setNameError] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender | null>(null);
  const [city, setCity] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [school, setSchool] = useState('');
  const [education, setEducation] = useState('');
  const [height, setHeight] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [tmpText, setTmpText] = useState('');
  const [tmpGender, setTmpGender] = useState<Gender | null>(null);
  const [tmpZodiac, setTmpZodiac] = useState('');
  const [tmpEdu, setTmpEdu] = useState('');
  const [tmpInterests, setTmpInterests] = useState<string[]>([]);

  useEffect(() => {
    api.get<UserDto>('/users/me').then(({ data }) => {
      setDisplayName(data.displayName ?? '');
      setBio(data.bio ?? '');
      setInterests(data.interests ?? []);
      setGender(data.gender ?? null);
      setCity(data.city ?? '');
      setZodiac(data.zodiac ?? '');
      setJobTitle(data.jobTitle ?? '');
      setCompany(data.company ?? '');
      setSchool(data.school ?? '');
      setEducation(data.education ?? '');
      setHeight(data.height ? String(data.height) : '');
      setAvatarUrl(data.avatarUrl ?? '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  function open(field: FieldKey) {
    setActiveField(field);
    if (field === 'name') setTmpText(displayName);
    else if (field === 'bio') setTmpText(bio);
    else if (field === 'city') setTmpText(city);
    else if (field === 'jobTitle') setTmpText(jobTitle);
    else if (field === 'company') setTmpText(company);
    else if (field === 'school') setTmpText(school);
    else if (field === 'height') setTmpText(height);
    else if (field === 'gender') setTmpGender(gender);
    else if (field === 'zodiac') setTmpZodiac(zodiac);
    else if (field === 'education') setTmpEdu(education);
    else if (field === 'passions') setTmpInterests([...interests]);
  }

  function commit() {
    if (activeField === 'name') { setDisplayName(tmpText.trim()); if (tmpText.trim()) setNameError(false); }
    else if (activeField === 'bio') setBio(tmpText.trim());
    else if (activeField === 'city') setCity(tmpText.trim());
    else if (activeField === 'jobTitle') setJobTitle(tmpText.trim());
    else if (activeField === 'company') setCompany(tmpText.trim());
    else if (activeField === 'school') setSchool(tmpText.trim());
    else if (activeField === 'height') setHeight(tmpText.trim());
    else if (activeField === 'gender') setGender(tmpGender);
    else if (activeField === 'zodiac') setZodiac(tmpZodiac);
    else if (activeField === 'education') setEducation(tmpEdu);
    else if (activeField === 'passions') setInterests(tmpInterests);
    setActiveField(null);
  }

  function toggleTmpInterest(key: string) {
    setTmpInterests((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { show('請在設定中允許存取相片庫'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', allowsEditing: true, aspect: [3, 4], quality: 0.85,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const asset = result.assets[0];
      const form = new FormData();
      form.append('file', { uri: asset.uri, type: 'image/jpeg', name: 'avatar.jpg' } as any);
      const { data } = await api.post<{ avatarUrl: string }>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarUrl(data.avatarUrl);
      show('照片已更新', 'success');
    } catch { show('上傳失敗，請稍後再試'); }
    finally { setUploading(false); }
  }

  function parseApiError(err: any): string {
    const msg = err?.response?.data?.message;
    if (Array.isArray(msg) && msg.length > 0) {
      const m: string = msg[0];
      if (/shorter than|maxLength/.test(m)) return '有欄位超過長度限制';
      if (/isEnum/.test(m)) return '有欄位選項不正確';
      if (/isArray|isString/.test(m)) return '格式錯誤，請重新填寫';
      return m;
    }
    if (typeof msg === 'string') return msg;
    return '儲存失敗，請稍後再試';
  }

  async function save() {
    if (!displayName.trim()) { setNameError(true); show('請填寫顯示名稱（必填）'); return; }
    setNameError(false);
    setSaving(true);
    try {
      const body: Record<string, unknown> = { displayName: displayName.trim() };
      if (interests.length > 0) body.interests = interests;
      if (bio.trim()) body.bio = bio.trim();
      if (gender) body.gender = gender;
      if (city.trim()) body.city = city.trim();
      if (zodiac) body.zodiac = zodiac;
      if (jobTitle.trim()) body.jobTitle = jobTitle.trim();
      if (company.trim()) body.company = company.trim();
      if (school.trim()) body.school = school.trim();
      if (education) body.education = education;
      const h = parseInt(height, 10);
      if (!isNaN(h) && h >= 100 && h <= 250) body.height = h;
      await api.patch('/users/me', body);
      show('資料已儲存', 'success');
      router.back();
    } catch (err: any) {
      show(parseApiError(err));
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#fff" />
      </SafeAreaView>
    );
  }

  const photoUri = avatarUrl ? `${API_URL}${avatarUrl}` : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>

      {/* ── Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <X size={20} color="#d4d4d8" />
        </Pressable>
        <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600' }}>編輯資訊</Text>
        <Pressable onPress={save} disabled={saving} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: saving ? '#27272a' : '#fff', alignItems: 'center', justifyContent: 'center' }}>
          {saving ? <ActivityIndicator size="small" color="#71717a" /> : <Check size={18} color="#000" strokeWidth={2.5} />}
        </Pressable>
      </View>

      {/* ── Tabs ── */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        {(['edit', 'preview'] as const).map((tab) => {
          const label = tab === 'edit' ? '編輯' : '預覽';
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{ flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: active ? '#f97316' : 'transparent' }}
            >
              <Text style={{ fontSize: 14, fontWeight: active ? '700' : '400', color: active ? '#f97316' : '#71717a' }}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── 預覽 Tab ── */}
      {activeTab === 'preview' && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ borderRadius: 20, overflow: 'hidden', backgroundColor: '#1c1c1e' }}>
            <View style={{ height: 380, position: 'relative' }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#27272a' }}>
                  <User size={64} color="#3f3f46" strokeWidth={1} />
                </View>
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.95)']}
                locations={[0.4, 0.7, 1]}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240 }}
              />
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
                <Text style={{ color: '#fff', fontSize: 26, fontWeight: '700', letterSpacing: -0.5 }}>{displayName || '你的名字'}</Text>
                {bio ? <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, marginTop: 6, lineHeight: 20 }} numberOfLines={3}>{bio}</Text> : null}
              </View>
            </View>
            {interests.length > 0 && (
              <View style={{ padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8, borderTopWidth: 0.5, borderTopColor: '#27272a' }}>
                {interests.slice(0, 5).map((t) => {
                  const item = INTERESTS.find((i) => i.key === t);
                  return (
                    <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 0.5, borderColor: '#3f3f46' }}>
                      {item && <Text style={{ fontSize: 13 }}>{item.emoji}</Text>}
                      <Text style={{ fontSize: 12, color: '#d4d4d8' }}>{t}</Text>
                    </View>
                  );
                })}
              </View>
            )}
            {(city || zodiac || school) && (
              <View style={{ padding: 14, gap: 8, borderTopWidth: 0.5, borderTopColor: '#27272a' }}>
                {city && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><MapPin size={13} color="#71717a" /><Text style={{ fontSize: 13, color: '#a1a1aa' }}>{city}</Text></View>}
                {zodiac && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Star size={13} color="#71717a" /><Text style={{ fontSize: 13, color: '#a1a1aa' }}>{zodiac}</Text></View>}
                {school && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><GraduationCap size={13} color="#71717a" /><Text style={{ fontSize: 13, color: '#a1a1aa' }}>{school}</Text></View>}
                {company && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Briefcase size={13} color="#71717a" /><Text style={{ fontSize: 13, color: '#a1a1aa' }}>{company}</Text></View>}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* ── 編輯 Tab ── */}
      {activeTab === 'edit' && (
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* ── Media ── */}
          <SectionLabel title="Media" />
          <View style={{ paddingHorizontal: PHOTO_PAD }}>
            <View style={{ flexDirection: 'row', gap: PHOTO_GAP }}>
              {[0, 1, 2].map((i) => (
                <PhotoSlot
                  key={i}
                  uri={i === 0 ? photoUri : null}
                  onPress={i === 0 ? pickPhoto : () => show('多張照片功能即將推出')}
                  uploading={i === 0 ? uploading : false}
                />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: PHOTO_GAP, marginTop: PHOTO_GAP }}>
              {[3, 4, 5].map((i) => (
                <PhotoSlot key={i} uri={null} onPress={() => show('多張照片功能即將推出')} />
              ))}
            </View>
          </View>
          <Text style={{ fontSize: 12, color: '#52525b', paddingHorizontal: 20, marginTop: 10, lineHeight: 18 }}>
            最多請新增 6 張照片。善用提示，向大家展現你的個人魅力。
          </Text>

          {/* ── 顯示名稱 ── */}
          <SectionLabel title="顯示名稱" badge="必填" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: nameError ? '#7f1d1d' : '#27272a' }}>
            <TextInput
              value={displayName}
              onChangeText={(v) => { setDisplayName(v); if (v.trim()) setNameError(false); }}
              placeholder="你的名稱"
              placeholderTextColor={nameError ? '#7f1d1d' : '#52525b'}
              maxLength={30}
              autoCapitalize="none"
              style={{ fontSize: 16, color: '#fff' }}
            />
          </View>
          {nameError && <Text style={{ fontSize: 12, color: '#ef4444', paddingHorizontal: 20, marginTop: 6 }}>請填寫名稱才能儲存</Text>}

          {/* ── About Me ── */}
          <SectionLabel title="About Me" badge="+20%" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: '#27272a' }}>
            <Text style={{ fontSize: 11, color: '#52525b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>關於我</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="介紹你自己（或你的毛孩）…"
              placeholderTextColor="#52525b"
              multiline
              maxLength={500}
              style={{ fontSize: 15, color: '#fff', minHeight: 90, textAlignVertical: 'top', lineHeight: 22 }}
            />
            <Text style={{ fontSize: 10, color: '#3f3f46', textAlign: 'right', marginTop: 6 }}>{bio.length}/500</Text>
          </View>

          {/* ── Interests ── */}
          <SectionLabel title="Interests" />
          <View style={{ marginHorizontal: 16 }}>
            {interests.length === 0 ? (
              <Pressable onPress={() => open('passions')} style={{ backgroundColor: '#1c1c1e', borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 0.5, borderColor: '#27272a' }}>
                <Text style={{ color: '#52525b', fontSize: 14 }}>新增你的興趣</Text>
              </Pressable>
            ) : (
              <View style={{ backgroundColor: '#1c1c1e', borderRadius: 14, borderWidth: 0.5, borderColor: '#27272a' }}>
                <View style={{ padding: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {interests.map((tag) => {
                    const item = INTERESTS.find((i) => i.key === tag);
                    return (
                      <View key={tag} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 0.5, borderColor: '#3f3f46' }}>
                        {item && <Text style={{ fontSize: 13 }}>{item.emoji}</Text>}
                        <Text style={{ fontSize: 13, color: '#d4d4d8' }}>{tag}</Text>
                      </View>
                    );
                  })}
                </View>
                <Pressable onPress={() => open('passions')} style={{ borderTopWidth: 0.5, borderTopColor: '#27272a', paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#71717a' }}>編輯興趣</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* ── 生活方式 ── */}
          <SectionLabel title="生活方式" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
            <InfoRow label="寵物" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="飲酒習慣" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="你吸菸的頻率是多少？" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="健身" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="社群媒體" value="" onPress={() => show('功能即將推出')} last />
          </View>

          {/* ── 歡迎跟我聊 ── */}
          <SectionLabel title="歡迎跟我聊" />
          <View style={{ marginHorizontal: 16, gap: 8 }}>
            {(['外出社交', '我的週末行程', '我 + 手機'].map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => show('功能即將推出')}
                style={{ backgroundColor: '#1c1c1e', borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: '#27272a', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <View>
                  <Text style={{ fontSize: 11, color: '#52525b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{prompt}</Text>
                  <Text style={{ fontSize: 14, color: '#3f3f46' }}>新增小測驗</Text>
                </View>
                <ChevronRight size={15} color="#3f3f46" />
              </Pressable>
            )))}
          </View>

          {/* ── Job & Education ── */}
          <SectionLabel title="工作與教育" badge="+6%" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
            <InfoRow label="職稱" value={jobTitle} onPress={() => open('jobTitle')} />
            <InfoRow label="公司" value={company} onPress={() => open('company')} />
            <InfoRow label="學校" value={school} onPress={() => open('school')} />
            <InfoRow label="教育程度" value={education} onPress={() => open('education')} last />
          </View>

          {/* ── 快來認識我 ── */}
          <SectionLabel title="快來認識我" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
            <InfoRow label="性別" value={gender ? GENDER_LABEL[gender] : ''} onPress={() => open('gender')} />
            <InfoRow label="星座" value={zodiac} onPress={() => open('zodiac')} />
            <InfoRow label="身高" value={height ? `${height} cm` : ''} onPress={() => open('height')} />
            <InfoRow label="交友目標" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="家庭計畫" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="溝通方式" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="戀愛模式" value="" onPress={() => show('功能即將推出')} last />
          </View>

          {/* ── 語言與城市 ── */}
          <SectionLabel title="更多資訊" />
          <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
            <InfoRow label="我會的語言" value="" onPress={() => show('功能即將推出')} />
            <InfoRow label="居住城市" value={city} onPress={() => open('city')} last />
          </View>

          <View style={{ height: 48 }} />
        </ScrollView>
      )}

      {/* ── Field Sheets ── */}

      {(['name', 'bio', 'city', 'jobTitle', 'company', 'school'] as FieldKey[]).map((f) => {
        const titles: Record<string, string> = { name: '顯示名稱', bio: '關於我', city: '居住城市', jobTitle: '職稱', company: '公司', school: '學校' };
        const multiline = f === 'bio';
        return (
          <FieldSheet key={f} visible={activeField === f} title={titles[f]} onClose={() => setActiveField(null)} onSave={commit}>
            <TextInput
              value={tmpText}
              onChangeText={setTmpText}
              placeholder={`輸入${titles[f]}`}
              placeholderTextColor="#52525b"
              multiline={multiline}
              maxLength={multiline ? 500 : 50}
              autoFocus
              style={{ backgroundColor: '#27272a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, minHeight: multiline ? 100 : undefined, textAlignVertical: multiline ? 'top' : 'center' }}
            />
            {multiline && <Text style={{ textAlign: 'right', fontSize: 10, color: '#3f3f46', marginTop: 4 }}>{tmpText.length}/500</Text>}
          </FieldSheet>
        );
      })}

      <FieldSheet visible={activeField === 'gender'} title="性別" onClose={() => setActiveField(null)} onSave={commit}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {GENDERS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setTmpGender(key)}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: tmpGender === key ? '#fff' : '#3f3f46', backgroundColor: tmpGender === key ? '#fff' : 'transparent', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 14, fontWeight: '600', color: tmpGender === key ? '#000' : '#d4d4d8' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </FieldSheet>

      <FieldSheet visible={activeField === 'zodiac'} title="星座" onClose={() => setActiveField(null)} onSave={commit}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {ZODIACS.map((z) => (
            <Chip key={z} label={z} selected={tmpZodiac === z} onPress={() => setTmpZodiac(tmpZodiac === z ? '' : z)} />
          ))}
        </View>
      </FieldSheet>

      <FieldSheet visible={activeField === 'education'} title="教育程度" onClose={() => setActiveField(null)} onSave={commit}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {EDUCATIONS.map((e) => (
            <Chip key={e} label={e} selected={tmpEdu === e} onPress={() => setTmpEdu(tmpEdu === e ? '' : e)} />
          ))}
        </View>
      </FieldSheet>

      <FieldSheet visible={activeField === 'passions'} title={`興趣（${tmpInterests.length}/5）`} onClose={() => setActiveField(null)} onSave={commit}>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {INTERESTS.map(({ key, emoji }) => {
              const sel = tmpInterests.includes(key);
              return (
                <Chip
                  key={key} label={key} emoji={emoji} selected={sel}
                  disabled={!sel && tmpInterests.length >= 5}
                  onPress={() => toggleTmpInterest(key)}
                />
              );
            })}
          </View>
        </ScrollView>
      </FieldSheet>

      <FieldSheet visible={activeField === 'height'} title="身高" onClose={() => setActiveField(null)} onSave={commit}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TextInput
            value={tmpText}
            onChangeText={(v) => setTmpText(v.replace(/[^0-9]/g, ''))}
            placeholder="例如 170"
            placeholderTextColor="#52525b"
            keyboardType="number-pad"
            maxLength={3}
            autoFocus
            style={{ flex: 1, backgroundColor: '#27272a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 20, textAlign: 'center' }}
          />
          <Text style={{ fontSize: 16, color: '#71717a' }}>cm</Text>
        </View>
      </FieldSheet>

    </SafeAreaView>
  );
}
