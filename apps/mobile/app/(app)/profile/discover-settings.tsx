import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useToastStore } from '../../../stores/toast';
import { useDiscoverPrefs } from '../../../stores/discoverPrefs';

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];
const GENDER_OPTIONS = ['男性', '女性', '多元性別'];
const ZODIAC_OPTIONS = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
const EDU_OPTIONS = ['高中', '大學', '碩士', '博士', '其他'];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', color: '#71717a', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 10 }}>
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ marginHorizontal: 16, backgroundColor: '#1c1c1e', borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: '#27272a' }}>
      {children}
    </View>
  );
}

function FilterRow({
  label, value, onPress, last,
}: {
  label: string; value?: string; onPress?: () => void; last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 15,
        borderBottomWidth: last ? 0 : 0.5, borderBottomColor: '#27272a',
      }}
    >
      <Text style={{ fontSize: 15, color: '#e4e4e7' }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {value ? <Text style={{ fontSize: 14, color: '#71717a' }}>{value}</Text> : null}
        <ChevronRight size={15} color="#3f3f46" />
      </View>
    </Pressable>
  );
}

function ToggleRow({
  label, subtitle, value, onChange, last,
}: {
  label: string; subtitle?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: last ? 0 : 0.5, borderBottomColor: '#27272a',
      gap: 12,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: '#e4e4e7' }}>{label}</Text>
        {subtitle ? <Text style={{ fontSize: 12, color: '#71717a', marginTop: 3, lineHeight: 17 }}>{subtitle}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: '#3f3f46', true: '#f97316' }} thumbColor="#fff" />
    </View>
  );
}

function SliderRow({
  label, value, min, max, unit, onDecrease, onIncrease, onSelect,
}: {
  label: string; value: number; min: number; max: number; unit: string;
  onDecrease: () => void; onIncrease: () => void; onSelect: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#27272a' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, color: '#e4e4e7' }}>{label}</Text>
        <Text style={{ fontSize: 15, color: '#fff', fontWeight: '600' }}>{value} {unit}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: '#27272a', borderRadius: 2 }}>
        <View style={{ height: 4, width: `${pct}%`, backgroundColor: '#f97316', borderRadius: 2 }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <Pressable onPress={onDecrease} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#27272a' }}>
          <Text style={{ color: '#d4d4d8', fontSize: 18, lineHeight: 20 }}>−</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {RADIUS_OPTIONS.map((km) => (
            <Pressable
              key={km}
              onPress={() => onSelect(km)}
              style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: value === km ? '#f97316' : '#27272a' }}
            >
              <Text style={{ color: value === km ? '#fff' : '#71717a', fontSize: 12, fontWeight: '600' }}>{km}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={onIncrease} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#27272a' }}>
          <Text style={{ color: '#d4d4d8', fontSize: 18, lineHeight: 20 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DiscoverSettingsScreen() {
  const router = useRouter();
  const { show } = useToastStore();
  const prefs = useDiscoverPrefs();

  const [radius, setRadius] = useState(prefs.radius);
  const [showMore, setShowMore] = useState(prefs.showMore);
  const [genderFilter, setGenderFilter] = useState<string[]>(prefs.genderFilter);
  const [roleFilter, setRoleFilter] = useState<'OWNER' | 'LOVER' | null>(prefs.roleFilter);
  const [zodiacFilter, setZodiacFilter] = useState('');
  const [eduFilter, setEduFilter] = useState('');

  function toggleGender(g: string) {
    setGenderFilter((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g],
    );
  }

  function save() {
    prefs.setRadius(radius);
    prefs.setShowMore(showMore);
    prefs.setGenderFilter(genderFilter);
    prefs.setRoleFilter(roleFilter);
    show('探索設定已儲存', 'success');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: '600', color: '#fff' }}>探索設定</Text>
        <Pressable onPress={save} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={18} color="#fff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── 對象篩選 ── */}
        <SectionHeader title="對象篩選" />
        <Card>
          <FilterRow label="興趣" value="選取" onPress={() => show('功能即將推出')} />
          <FilterRow label="星座" value={zodiacFilter || '選取'} onPress={() => show('功能即將推出')} />
          <FilterRow label="教育程度" value={eduFilter || '選取'} onPress={() => show('功能即將推出')} />
          <FilterRow label="飲酒習慣" value="選取" onPress={() => show('功能即將推出')} />
          <FilterRow label="寵物" value="選取" onPress={() => show('功能即將推出')} last />
        </Card>

        {/* ── DISCOVERY ── */}
        <SectionHeader title="DISCOVERY" />
        <Card>
          {/* Distance slider */}
          <SliderRow
            label="最大距離"
            value={radius}
            min={1}
            max={50}
            unit="km"
            onDecrease={() => setRadius((r) => Math.max(1, r - 1))}
            onIncrease={() => setRadius((r) => Math.min(50, r + 1))}
            onSelect={(km) => setRadius(km)}
          />

          {/* Show more toggle */}
          <ToggleRow
            label="在我滑完可瀏覽的檔案時，向我顯示還一點的交友檔案。"
            value={showMore}
            onChange={setShowMore}
          />

          {/* Gender filter */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#27272a' }}>
            <Text style={{ fontSize: 15, color: '#e4e4e7', marginBottom: 12 }}>有興趣的對象</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {GENDER_OPTIONS.map((g) => {
                const selected = genderFilter.includes(g);
                return (
                  <Pressable
                    key={g}
                    onPress={() => toggleGender(g)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                      borderColor: selected ? '#f97316' : '#3f3f46',
                      backgroundColor: selected ? 'rgba(249,115,22,0.15)' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: selected ? '#f97316' : '#71717a', fontWeight: selected ? '600' : '400' }}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Role filter */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontSize: 15, color: '#e4e4e7', marginBottom: 12 }}>身分篩選</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {([{ label: '全部', value: null }, { label: '飼主', value: 'OWNER' }, { label: '愛寵人', value: 'LOVER' }] as const).map(({ label, value }) => {
                const selected = roleFilter === value;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setRoleFilter(value)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
                      borderColor: selected ? '#f97316' : '#3f3f46',
                      backgroundColor: selected ? 'rgba(249,115,22,0.15)' : 'transparent',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, color: selected ? '#f97316' : '#71717a', fontWeight: selected ? '600' : '400' }}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}
