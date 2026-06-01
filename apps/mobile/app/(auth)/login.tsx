import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRole } from '@pawpals/shared';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';

export default function LoginScreen() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const { show } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorBanner, setErrorBanner] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErrorBanner('');
    if (!email.includes('@')) { setErrorBanner('請輸入有效的 Email'); return; }
    if (!password) { setErrorBanner('請輸入密碼'); return; }
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; userId: string; role: UserRole }>(
        '/auth/login',
        { email: email.trim(), password },
      );
      await setTokens(data.accessToken, data.userId, data.role);
      router.replace('/(app)/(tabs)/swipe');
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setErrorBanner('Email 或密碼錯誤');
      } else {
        show('登入失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
            <Pressable onPress={() => router.back()} className="p-1.5 -ml-1">
              <ChevronLeft size={18} color="#d4d4d8" />
            </Pressable>
            <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
              登入
            </Text>
            <View className="w-6" />
          </View>

          <View className="px-5 mt-6">
            <Text className="text-[24px] font-semibold text-white tracking-tight">
              歡迎回來
            </Text>

            {errorBanner ? (
              <View className="mt-4 rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3"
                style={{ borderWidth: 0.5 }}>
                <Text className="text-red-400 text-[13px]">{errorBanner}</Text>
              </View>
            ) : null}

            <View className="mt-6 gap-4">
              <View>
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">
                  Email
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#52525b"
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5 }}
                />
              </View>
              <View>
                <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">
                  密碼
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="#52525b"
                  className="bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] border border-zinc-800"
                  style={{ borderWidth: 0.5 }}
                />
              </View>
            </View>

            <Pressable
              onPress={submit}
              disabled={loading}
              className={`mt-8 rounded-2xl py-4 items-center ${loading ? 'bg-zinc-800' : 'bg-white'}`}
            >
              <Text className={`text-[14px] font-semibold ${loading ? 'text-zinc-500' : 'text-black'}`}>
                {loading ? '登入中…' : '登入'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
