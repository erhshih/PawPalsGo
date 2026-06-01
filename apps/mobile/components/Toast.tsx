import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useToastStore } from '../stores/toast';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <View className="absolute bottom-24 left-4 right-4 z-50 gap-2">
      {toasts.map((toast) => (
        <Pressable
          key={toast.id}
          onPress={() => dismiss(toast.id)}
          className={`rounded-2xl px-4 py-3 ${
            toast.type === 'error'
              ? 'bg-zinc-900 border border-red-800/50'
              : toast.type === 'success'
              ? 'bg-zinc-900 border border-white/20'
              : 'bg-zinc-900 border border-zinc-700'
          }`}
        >
          <Text className="text-white text-sm">{toast.message}</Text>
        </Pressable>
      ))}
    </View>
  );
}
