import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/auth';
import { ToastContainer } from '../components/Toast';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const { isLoading, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-zinc-950 items-center justify-center">
        <ActivityIndicator color="#ffffff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <ToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
