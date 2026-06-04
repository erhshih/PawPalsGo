import { Tabs } from 'expo-router';
import { Compass, MessageCircle, User } from 'lucide-react-native';
import { useUnreadStore } from '../../../stores/unread';

export default function TabsLayout() {
  const { perMatch } = useUnreadStore();
  const totalUnread = Object.values(perMatch).reduce((s, n) => s + n, 0);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'rgba(28,28,30,0.85)',
          borderTopWidth: 0,
          borderWidth: 0.5,
          borderColor: 'rgba(255,255,255,0.12)',
          borderRadius: 24,
          marginHorizontal: 16,
          marginBottom: 24,
          height: 58,
          paddingBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'hidden',
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
        tabBarLabelStyle: {
          fontFamily: 'ui-monospace',
          fontSize: 9,
          letterSpacing: 2,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="swipe"
        options={{
          title: '探索',
          tabBarIcon: ({ color, focused }) => (
            <Compass size={20} color={color} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: '訊息',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ffffff', color: '#000000', fontSize: 10 },
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle size={20} color={color} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '身份',
          tabBarIcon: ({ color, focused }) => (
            <User size={20} color={color} strokeWidth={focused ? 2 : 1.5} />
          ),
        }}
      />
    </Tabs>
  );
}
