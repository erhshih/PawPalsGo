import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth';

export default function Index() {
  const { accessToken } = useAuthStore();
  return accessToken
    ? <Redirect href="/(app)/(tabs)/swipe" />
    : <Redirect href="/(auth)/welcome" />;
}
