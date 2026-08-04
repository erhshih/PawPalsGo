import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Gift, History } from 'lucide-react-native';
import { RedemptionRewardDto, RedemptionDto } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { useWalletStore } from '../../../stores/wallet';
import { useToastStore } from '../../../stores/toast';

function RewardCard({ reward, balance, onRedeem }: { reward: RedemptionRewardDto; balance: number; onRedeem: () => void }) {
  const outOfStock = reward.stock != null && reward.stock <= 0;
  const affordable = balance >= reward.costJerky;
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 16, backgroundColor: '#1c1c1e', borderWidth: 0.5, borderColor: '#27272a', padding: 16 }}>
      <Text style={{ color: '#71717a', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{reward.partnerName}</Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 4 }}>{reward.title}</Text>
      {reward.description ? <Text style={{ color: '#a1a1aa', fontSize: 13, marginTop: 6 }}>{reward.description}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <Text style={{ color: '#f97316', fontSize: 15, fontWeight: '700' }}>{reward.costJerky} 🦴</Text>
        <Pressable
          onPress={onRedeem}
          disabled={outOfStock || !affordable}
          style={{
            borderRadius: 12, paddingHorizontal: 18, paddingVertical: 9,
            backgroundColor: outOfStock || !affordable ? '#27272a' : '#fff',
          }}
        >
          <Text style={{ color: outOfStock || !affordable ? '#71717a' : '#000', fontSize: 13, fontWeight: '700' }}>
            {outOfStock ? '已兌完' : !affordable ? '肉乾不足' : '兌換'}
          </Text>
        </Pressable>
      </View>
      {reward.stock != null && !outOfStock && (
        <Text style={{ color: '#52525b', fontSize: 11, marginTop: 8 }}>剩餘 {reward.stock} 份</Text>
      )}
    </View>
  );
}

export default function RedemptionsScreen() {
  const router = useRouter();
  const { balance, deductBalance } = useWalletStore();
  const { show } = useToastStore();
  const [rewards, setRewards] = useState<RedemptionRewardDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get<RedemptionRewardDto[]>('/redemptions/rewards');
      setRewards(data);
    } catch {}
    setLoaded(true);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function redeem(reward: RedemptionRewardDto) {
    Alert.alert('確認兌換', `使用 ${reward.costJerky} 塊肉乾兌換「${reward.title}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '兌換',
        onPress: async () => {
          try {
            const { data } = await api.post<RedemptionDto>(`/redemptions/rewards/${reward.id}`);
            deductBalance(reward.costJerky);
            load();
            Alert.alert('兌換成功！', `兌換碼：${data.code}\n請至合作品牌端出示此碼領取。`);
          } catch (e: any) {
            const msg = e?.response?.data?.message;
            show(msg === 'OUT_OF_STOCK' ? '已兌完' : msg === 'INSUFFICIENT_BALANCE' ? '肉乾不足' : '兌換失敗，請稍後再試');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#09090b' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1c1c1e' }}>
        <Pressable onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={22} color="#d4d4d8" />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>肉乾兌換</Text>
        <Pressable onPress={() => router.push('/(app)/redemptions/history')} style={{ padding: 6 }}>
          <History size={18} color="#d4d4d8" />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
        <Text style={{ color: '#71717a', fontSize: 12 }}>目前肉乾餘額：<Text style={{ color: '#f97316', fontWeight: '700' }}>{balance}</Text></Text>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(r) => r.id}
        renderItem={({ item }) => <RewardCard reward={item} balance={balance} onRedeem={() => redeem(item)} />}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
        ListEmptyComponent={
          loaded ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Gift size={28} color="#3f3f46" />
              <Text style={{ color: '#71717a', fontSize: 14, marginTop: 10 }}>目前沒有可兌換的獎勵</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
