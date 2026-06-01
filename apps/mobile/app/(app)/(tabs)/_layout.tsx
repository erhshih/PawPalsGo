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
          backgroundColor: '#09090b',
          borderTopColor: '#27272a',
          borderTopWidth: 0.5,
          height: 78,
          paddingBottom: 20,
        },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#52525b',
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
