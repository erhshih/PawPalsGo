import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '../../stores/auth';

export default function AppLayout() {
  const { accessToken } = useAuthStore();
  if (!accessToken) return <Redirect href="/(auth)/welcome" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#09090b' },
      }}
    />
  );
}
