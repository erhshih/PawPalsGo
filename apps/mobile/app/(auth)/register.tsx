import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserRole, Gender } from '@pawpals/shared';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth';
import { useToastStore } from '../../stores/toast';

export default function RegisterScreen() {
  const { role } = useLocalSearchParams<{ role: UserRole }>();
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const { show } = useToastStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.includes('@')) e.email = '請輸入有效的 Email';
    if (password.length < 8) e.password = '密碼至少 8 個字元';
    if (password !== confirm) e.confirm = '密碼不一致';
    if (!gender) e.gender = '請選擇性別';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; userId: string }>('/auth/register', {
        email, password, role, gender,
      });
      await setTokens(data.accessToken, data.userId, role!);
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'EMAIL_TAKEN') {
        setErrors({ email: '此 Email 已被使用' });
      } else {
        show('註冊失敗，請稍後再試');
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
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
            <Pressable onPress={() => router.back()} className="p-1.5 -ml-1">
              <ChevronLeft size={18} color="#d4d4d8" />
            </Pressable>
            <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
              step 01 · register
            </Text>
            <View className="w-6" />
          </View>

          <View className="px-5 mt-6">
            <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
              {role === 'OWNER' ? '01 / 飼主' : '02 / 貓狗奴'}
            </Text>
            <Text className="mt-2 text-[24px] font-semibold text-white tracking-tight">
              建立帳號
            </Text>

            {/* Gender */}
            <View className="mt-8">
              <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">性別</Text>
              <View className="flex-row gap-2">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => {
                  const label = g === 'MALE' ? '男' : g === 'FEMALE' ? '女' : '其他';
                  return (
                    <Pressable
                      key={g}
                      onPress={() => setGender(g)}
                      className={`flex-1 rounded-xl py-3 items-center ${gender === g ? 'bg-white' : 'border border-zinc-700 bg-zinc-900'}`}
                      style={gender !== g ? { borderWidth: 0.5 } : {}}
                    >
                      <Text className={`text-[14px] font-semibold ${gender === g ? 'text-black' : 'text-zinc-300'}`}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.gender && <Text className="mt-1 text-[12px] text-red-400">{errors.gender}</Text>}
            </View>

            <View className="mt-5 gap-4">
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Field
                label="密碼"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
              />
              <Field
                label="確認密碼"
                value={confirm}
                onChangeText={setConfirm}
                error={errors.confirm}
                secureTextEntry
              />
            </View>

            <Pressable
              onPress={submit}
              disabled={loading}
              className={`mt-8 rounded-2xl py-4 items-center ${
                loading ? 'bg-zinc-800' : 'bg-white'
              }`}
            >
              <Text className={`text-[14px] font-semibold ${loading ? 'text-zinc-500' : 'text-black'}`}>
                {loading ? '建立中…' : '建立帳號'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label, value, onChangeText, error, secureTextEntry, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View>
      <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        placeholderTextColor="#52525b"
        className={`bg-zinc-900 text-white rounded-xl px-4 py-3.5 text-[14px] ${
          error ? 'border border-red-800' : 'border border-zinc-800'
        }`}
        style={{ borderWidth: 0.5 }}
      />
      {error && (
        <Text className="mt-1 text-[12px] text-red-400">{error}</Text>
      )}
    </View>
  );
}
