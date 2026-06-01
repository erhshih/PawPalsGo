import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight, Dog, Cat } from 'lucide-react-native';
import { UserRole } from '@pawpals/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/auth';

function IdentityCard({
  role,
  label,
  subtitle,
  description,
  tip,
  Icon,
  inverted,
  onPress,
}: {
  role: UserRole;
  label: string;
  subtitle: string;
  description: string;
  tip: string;
  Icon: typeof Dog;
  inverted: boolean;
  onPress: () => void;
}) {
  const rotation = useSharedValue(0);
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Pressable
      onPressIn={() => { rotation.value = withTiming(-45, { duration: 200 }); }}
      onPressOut={() => { rotation.value = withTiming(0, { duration: 200 }); }}
      onPress={onPress}
      className={`w-full rounded-2xl p-5 active:scale-[0.99] ${
        inverted ? 'bg-white' : 'bg-zinc-900 border border-zinc-800'
      }`}
      style={{ borderWidth: inverted ? 0 : 0.5 }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text
            className={`font-mono text-[10px] tracking-widest uppercase ${
              inverted ? 'text-zinc-500' : 'text-zinc-500'
            }`}
          >
            {subtitle}
          </Text>
          <Text
            className={`mt-3 text-[28px] font-semibold leading-none ${
              inverted ? 'text-black' : 'text-white'
            }`}
          >
            {label}
          </Text>
          <Text
            className={`mt-2 text-[13px] leading-relaxed ${
              inverted ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            {description}
          </Text>
        </View>
        <Animated.View
          style={arrowStyle}
          className={`rounded-full p-2.5 ${inverted ? 'bg-black' : 'bg-white'}`}
        >
          <ArrowRight size={16} color={inverted ? '#fff' : '#000'} />
        </Animated.View>
      </View>
      <View className="mt-5 flex-row items-center gap-2">
        <Icon size={14} color="#71717a" strokeWidth={1.5} />
        <Text className="font-mono text-[11px] text-zinc-500">{tip}</Text>
      </View>
    </Pressable>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { setTokens } = useAuthStore();

  function pick(role: UserRole) {
    router.push({ pathname: '/(auth)/register', params: { role } });
  }

  async function devLogin(role: UserRole) {
    await setTokens('dev-token', 'dev-user-id', role);
    router.replace('/(app)/(tabs)/swipe');
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand bar */}
        <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
          <Text className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">
            v0.1 · prototype
          </Text>
          <Text className="font-mono text-[10px] tracking-widest text-zinc-500">
            {new Date().toLocaleDateString('zh-TW').replace(/\//g, ' · ')}
          </Text>
        </View>

        {/* Wordmark */}
        <View className="px-6 pt-16">
          <Text className="text-[42px] font-semibold leading-[0.95] tracking-tight text-white">
            PawPals{'\n'}
            <Text className="text-zinc-400 italic font-light">Go.</Text>
          </Text>
          <Text className="mt-4 text-[13px] leading-relaxed text-zinc-500">
            雙軌制毛孩交友。{'\n'}選一個身份開始 — 你可以隨時切換。
          </Text>
        </View>

        {/* Identity cards */}
        <View className="mt-auto px-6 pb-6 gap-3">
          <IdentityCard
            role="OWNER"
            label="OWNER"
            subtitle="01 / 飼主"
            description="我家有毛孩 · 想幫他找朋友、找伴、找一場散步。"
            tip="建立毛孩檔案 · 上傳三張照片 · 開始配對"
            Icon={Dog}
            inverted={true}
            onPress={() => pick('OWNER')}
          />
          <IdentityCard
            role="LOVER"
            label="LOVER"
            subtitle="02 / 貓狗奴"
            description="沒養但很愛 · 找一隻可以代散、代擼、代陪伴的毛朋友。"
            tip="瀏覽附近毛孩 · 投餵肉乾 · 發起相約"
            Icon={Cat}
            inverted={false}
            onPress={() => pick('LOVER')}
          />
          {/* Login link */}
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            className="items-center pt-2"
          >
            <Text className="font-mono text-[10px] tracking-widest text-zinc-600 uppercase">
              — 已有帳號？登入 —
            </Text>
          </Pressable>

          {/* Dev bypass */}
          <View className="mt-4 border-t border-zinc-800 pt-4">
            <Text className="font-mono text-[9px] tracking-widest text-zinc-700 uppercase text-center mb-2">
              dev · 跳過登入
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => devLogin('OWNER')}
                className="flex-1 rounded-xl border border-zinc-800 py-2.5 items-center"
                style={{ borderWidth: 0.5 }}
              >
                <Text className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">OWNER</Text>
              </Pressable>
              <Pressable
                onPress={() => devLogin('LOVER')}
                className="flex-1 rounded-xl border border-zinc-800 py-2.5 items-center"
                style={{ borderWidth: 0.5 }}
              >
                <Text className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase">LOVER</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
