import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, Pressable,
  KeyboardAvoidingView, Platform, Modal, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, Beef, Calendar, QrCode, Camera, RotateCcw, AlertTriangle, CheckCheck } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { MessageDto, MeetingDto, MeetingStatus } from '@pawpals/shared';
import { api } from '../../../lib/api';
import { connectSocket, getSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../stores/auth';
import { useWalletStore } from '../../../stores/wallet';
import { useToastStore } from '../../../stores/toast';
import { useUnreadStore } from '../../../stores/unread';

type ExtMessage = MessageDto & { from?: 'sys' };

function MeetingCard({
  meeting, matchId, userId, onCancel, onUpdated,
}: {
  meeting: MeetingDto; matchId: string; userId: string;
  onCancel: (earlyCancel: boolean) => void;
  onUpdated: (m: MeetingDto) => void;
}) {
  const isInitiator = meeting.initiatorId === userId;
  const scheduled = new Date(meeting.scheduledAt);
  const now = new Date();
  const isCheckInTime = now >= scheduled;
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [cameraMode, setCameraMode] = useState(false);
  const [showVerified, setShowVerified] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const { show } = useToastStore();
  const { addBalance } = useWalletStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchQR() {
    try {
      const { data } = await api.get<{ token: string; expiresIn: number }>(`/meetings/${meeting.id}/qr`);
      setQrToken(data.token);
      setQrCountdown(30);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setQrCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current!);
            fetchQR();
            return 30;
          }
          return c - 1;
        });
      }, 1000);
    } catch {
      show('無法取得 QR Code，請稍後再試');
    }
  }

  useEffect(() => {
    if (isCheckInTime && !isInitiator && meeting.status === 'SCHEDULED') fetchQR();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isCheckInTime, meeting.status]);

  async function verifyScan() {
    if (!qrToken) return;
    try {
      await api.post(`/meetings/${meeting.id}/verify`, { token: qrToken });
      setShowVerified(true);
      addBalance(5);
      onUpdated({ ...meeting, status: 'COMPLETED' });
    } catch (e: any) {
      const code = e?.response?.data?.code;
      show(code === 'QR_EXPIRED' ? 'QR Code 已過期，請重新掃描' : 'QR 驗證失敗');
    }
  }

  async function cancelMeeting() {
    try {
      const { data } = await api.delete<MeetingDto>(`/meetings/${meeting.id}`);
      setShowCancelModal(false);
      const isBenign = data.status === 'CANCELLED_BENIGN';
      if (isBenign) {
        addBalance(meeting.escrow);
        Alert.alert('取消成功', `${meeting.escrow} 塊肉乾已全額退回您的錢包。`);
      } else {
        Alert.alert('取消成功', `距約定時間不足 2 小時，${meeting.escrow} 塊肉乾已補償給對方。`);
      }
      onUpdated(data);
    } catch {
      show('取消失敗，請稍後再試');
    }
  }

  if (meeting.status === 'COMPLETED') {
    return (
      <View className="mx-4 mb-3 rounded-2xl border border-white/20 p-4 bg-zinc-900/60 items-center" style={{ borderWidth: 0.5 }}>
        <Text className="text-white text-[14px] font-semibold">約會已完成 🎉</Text>
        <Text className="mt-1 text-zinc-500 text-[12px]">已於 {scheduled.toLocaleString('zh-TW')} 完成簽到</Text>
      </View>
    );
  }

  if (meeting.status.startsWith('CANCELLED')) {
    return (
      <View className="mx-4 mb-3 rounded-2xl border border-zinc-800 p-4 bg-zinc-900/40" style={{ borderWidth: 0.5 }}>
        <Text className="text-zinc-500 text-[13px]">約會已取消（{meeting.status === 'CANCELLED_BENIGN' ? '良性' : '惡意'}）</Text>
      </View>
    );
  }

  return (
    <>
      <View className="mx-4 mb-3 rounded-2xl border border-zinc-800 bg-zinc-900/60" style={{ borderWidth: 0.5 }}>
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">
              {isCheckInTime ? '線下見面簽到' : '進行中的約會'}
            </Text>
            <View className="rounded-full border border-zinc-700 px-2 py-0.5" style={{ borderWidth: 0.5 }}>
              <Text className="font-mono text-[9px] tracking-widest text-white uppercase">托管 5 🥩</Text>
            </View>
          </View>
          <Text className="mt-2 text-white text-[14px] font-medium">
            {scheduled.toLocaleString('zh-TW')}
          </Text>

          {isCheckInTime ? (
            isInitiator ? (
              /* Initiator: camera scan */
              <View className="mt-4">
                {cameraMode ? (
                  <View className="rounded-xl bg-zinc-800 h-40 items-center justify-center">
                    <View className="w-20 h-20 border-2 border-white/60 rounded-xl" />
                    <Text className="mt-3 text-zinc-400 text-[12px]">對準 QR Code 掃描</Text>
                    <Pressable onPress={verifyScan} className="mt-3 bg-white rounded-xl px-6 py-2">
                      <Text className="text-black text-[13px] font-semibold">模擬掃碼成功</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setCameraMode(true)}
                    className="mt-2 rounded-xl border border-white/30 py-3 items-center flex-row justify-center gap-2"
                    style={{ borderWidth: 0.5 }}
                  >
                    <Camera size={16} color="#fff" />
                    <Text className="text-white text-[13px] font-semibold">開啟相機掃描簽到</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              /* Non-initiator: QR display */
              <View className="mt-4 items-center">
                {qrToken && (
                  <>
                    <View className="bg-white p-3 rounded-xl">
                      <QRCode value={qrToken} size={160} />
                    </View>
                    {/* Countdown bar */}
                    <View className="mt-3 w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <View
                        className="h-full bg-white rounded-full"
                        style={{ width: `${(qrCountdown / 30) * 100}%` }}
                      />
                    </View>
                    <Text className="mt-1 font-mono text-[10px] tracking-widest text-zinc-500">
                      {qrCountdown}s 後刷新
                    </Text>
                  </>
                )}
              </View>
            )
          ) : (
            /* Cancel options */
            <View className="mt-4 gap-2">
              <Pressable
                onPress={() => setShowCancelModal(true)}
                className="rounded-xl border border-zinc-700 py-2.5 items-center"
                style={{ borderWidth: 0.5 }}
              >
                <Text className="text-zinc-400 text-[13px]">取消約會</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {showVerified && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowVerified(false)}>
          <View className="flex-1 bg-black/80 items-center justify-center px-6">
            <View className="w-full bg-zinc-900 rounded-3xl p-8 items-center border border-zinc-800" style={{ borderWidth: 0.5 }}>
              <Text className="text-[42px]">🐾</Text>
              <Text className="mt-4 text-[20px] font-semibold text-white text-center">
                驗證成功！
              </Text>
              <Text className="mt-3 text-zinc-400 text-[13px] text-center">
                託管的 5 塊肉乾已安全撥入非發起者的錢包 🐾
              </Text>
              <Pressable onPress={() => setShowVerified(false)} className="mt-6 w-full rounded-2xl py-4 bg-white items-center">
                <Text className="text-black text-[14px] font-semibold">太好了！</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <Modal visible={showCancelModal} transparent animationType="fade" onRequestClose={() => setShowCancelModal(false)}>
        <View className="flex-1 bg-black/80 items-center justify-center px-6">
          <View className="w-full bg-zinc-900 rounded-3xl p-6 border border-zinc-800" style={{ borderWidth: 0.5 }}>
            <Text className="text-white text-[17px] font-semibold mb-2">取消約會</Text>
            <Text className="text-zinc-400 text-[13px] mb-6 leading-relaxed">
              確定取消嗎？距約定時間 2 小時內取消，{meeting.escrow} 塊肉乾將補償給對方。
            </Text>
            <View className="gap-3">
              <Pressable onPress={cancelMeeting}
                className="rounded-xl border border-red-800/50 py-3 items-center" style={{ borderWidth: 0.5 }}>
                <Text className="text-red-400 text-[13px]">確定取消</Text>
              </Pressable>
              <Pressable onPress={() => setShowCancelModal(false)}
                className="rounded-xl py-3 items-center">
                <Text className="text-zinc-500 text-[13px]">不取消</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function ScheduleModal({ open, onClose, onConfirm, loading }: {
  open: boolean; onClose: () => void;
  onConfirm: (dt: Date) => void; loading: boolean;
}) {
  const [dayOffset, setDayOffset] = useState(1);
  const [hour, setHour] = useState(14);

  function confirm() {
    const dt = new Date();
    dt.setDate(dt.getDate() + dayOffset);
    dt.setHours(hour, 0, 0, 0);
    onConfirm(dt);
  }

  if (!open) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/70">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-zinc-900 rounded-t-3xl p-5 pb-8 border-t border-zinc-800" style={{ borderWidth: 0.5 }}>
          <View className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
          <Text className="text-white text-[17px] font-semibold mb-4">發起 Go! 約會</Text>

          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">選擇日期（今後 N 天）</Text>
          <View className="flex-row gap-2 mb-4">
            {[1,2,3,4,5,6,7].map((d) => (
              <Pressable key={d} onPress={() => setDayOffset(d)}
                className={`rounded-xl px-3 py-2 ${dayOffset === d ? 'bg-white' : 'border border-zinc-700 bg-zinc-800'}`}
                style={dayOffset !== d ? { borderWidth: 0.5 } : {}}>
                <Text className={`text-[13px] font-semibold ${dayOffset === d ? 'text-black' : 'text-zinc-300'}`}>+{d}天</Text>
              </Pressable>
            ))}
          </View>

          <Text className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 mb-2">選擇時間</Text>
          <View className="flex-row gap-2 mb-6">
            {[10,12,14,16,18,20].map((h) => (
              <Pressable key={h} onPress={() => setHour(h)}
                className={`rounded-xl px-3 py-2 ${hour === h ? 'bg-white' : 'border border-zinc-700 bg-zinc-800'}`}
                style={hour !== h ? { borderWidth: 0.5 } : {}}>
                <Text className={`text-[13px] font-semibold ${hour === h ? 'text-black' : 'text-zinc-300'}`}>{h}:00</Text>
              </Pressable>
            ))}
          </View>

          {/* Escrow notice */}
          <View className="rounded-xl border border-zinc-700 px-4 py-3 mb-5 bg-black/30" style={{ borderWidth: 0.5 }}>
            <Text className="text-zinc-400 text-[12px] leading-relaxed">
              發起約會將扣除您 <Text className="text-white">5 塊肉乾 🥩</Text> 作為誠意金，並暫時由平台託管。距約定時間 2 小時內取消，肉乾將不予退還並直接補償給對方。
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable onPress={onClose}
              className="flex-1 rounded-xl py-3 border border-zinc-700 items-center" style={{ borderWidth: 0.5 }}>
              <Text className="text-zinc-300 text-[13px]">取消</Text>
            </Pressable>
            <Pressable onPress={confirm} disabled={loading}
              className={`flex-1 rounded-xl py-3 items-center ${loading ? 'bg-zinc-700' : 'bg-white'}`}>
              <Text className={`text-[13px] font-semibold ${loading ? 'text-zinc-500' : 'text-black'}`}>
                {loading ? '建立中…' : '確認並扣除 5 🥩'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { balance, deductBalance } = useWalletStore();
  const { show } = useToastStore();
  const { clear: clearUnread } = useUnreadStore();

  const [messages, setMessages] = useState<ExtMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [meeting, setMeeting] = useState<MeetingDto | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [partnerReadAt, setPartnerReadAt] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    api.get<ExtMessage[]>(`/matches/${matchId}/messages`).then(({ data }) => {
      setMessages(data.reverse());
      setHasMore(data.length >= 20);
    }).catch(() => {});
    api.get<MeetingDto>(`/matches/${matchId}/meeting`).then(({ data }) => { if (data) setMeeting(data); }).catch(() => {});
    api.post(`/matches/${matchId}/read`).catch(() => {});
    if (matchId) clearUnread(matchId);

    let cleanup: (() => void) | undefined;
    connectSocket().then((socket) => {
      socket.emit('chat:join', { matchId });

      const onMessage = (msg: MessageDto) => {
        if (msg.senderId === userId) return;
        setMessages((m) => [...m, msg]);
        api.post(`/matches/${matchId}/read`).catch(() => {});
        if (matchId) clearUnread(matchId);
      };
      const onRead = ({ userId: readerId, readAt }: { userId: string; readAt: string }) => {
        if (readerId !== userId) setPartnerReadAt(readAt);
      };
      const onMeeting = (m: MeetingDto) => setMeeting(m);

      socket.on('chat:message', onMessage);
      socket.on('chat:read', onRead);
      socket.on('meeting:updated', onMeeting);

      cleanup = () => {
        socket.off('chat:message', onMessage);
        socket.off('chat:read', onRead);
        socket.off('meeting:updated', onMeeting);
      };
    });

    return () => { cleanup?.(); };
  }, [matchId]);

  async function loadMore() {
    if (!hasMore || loadingMore || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get<ExtMessage[]>(`/matches/${matchId}/messages`, {
        params: { before: oldest.createdAt, limit: 20 },
      });
      const older = data.reverse();
      setMessages((m) => [...older, ...m]);
      setHasMore(data.length >= 20);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  }

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      const { data } = await api.post<ExtMessage>(`/matches/${matchId}/messages`, { text });
      setMessages((m) => [...m, data]);
    } catch {
      show('傳送失敗，請稍後再試');
    }
  }

  async function createMeeting(dt: Date) {
    if (balance < 5) { show('肉乾不足，請先儲值'); return; }
    setScheduleLoading(true);
    try {
      const { data } = await api.post<MeetingDto>('/meetings', {
        matchId,
        scheduledAt: dt.toISOString(),
      });
      deductBalance(5);
      setMeeting(data);
      setShowSchedule(false);
      const sysMsg: ExtMessage = {
        id: Date.now().toString(),
        matchId: matchId!,
        senderId: 'sys',
        text: `已發起 Go! 約會 — ${dt.toLocaleString('zh-TW')}，5 肉乾已托管。`,
        createdAt: new Date().toISOString(),
        from: 'sys',
      };
      setMessages((m) => [...m, sysMsg]);
    } catch {
      show('發起約會失敗，請稍後再試');
    } finally {
      setScheduleLoading(false);
    }
  }

  const myMessages = messages.filter((m) => m.senderId === userId);
  const lastMyMessageId = myMessages[myMessages.length - 1]?.id;
  const isLastRead = partnerReadAt && myMessages.length > 0 &&
    partnerReadAt >= myMessages[myMessages.length - 1].createdAt;

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const hhmm = d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    return sameDay ? hhmm : `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
  }

  function renderItem({ item }: { item: ExtMessage }) {
    const isSys = item.from === 'sys' || item.senderId === 'sys';
    const isMe = item.senderId === userId;

    if (isSys) {
      return (
        <View className="items-center my-2">
          <Text className="text-zinc-500 text-[12px] italic text-center px-8">{item.text}</Text>
        </View>
      );
    }
    const isLastMine = isMe && item.id === lastMyMessageId;
    return (
      <View className={`mb-2 px-4 ${isMe ? 'items-end' : 'items-start'}`}>
        <View
          className={`rounded-2xl px-4 py-2.5 max-w-[75%] ${
            isMe ? 'bg-white' : 'bg-zinc-800 border border-zinc-700'
          }`}
          style={!isMe ? { borderWidth: 0.5 } : {}}
        >
          <Text className={`text-[14px] leading-relaxed ${isMe ? 'text-black' : 'text-white'}`}>
            {item.text}
          </Text>
        </View>
        <Text className={`text-[10px] text-zinc-500 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
          {formatTime(item.createdAt)}
        </Text>
        {isLastMine && isLastRead && (
          <View className="flex-row items-center gap-1 mr-1">
            <CheckCheck size={12} color="#71717a" />
            <Text className="text-[10px] text-zinc-500">已讀</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      {/* Header */}
      <View className="flex-row items-center px-5 pt-3 pb-3 border-b border-zinc-800" style={{ borderBottomWidth: 0.5 }}>
        <Pressable onPress={() => router.back()} className="p-1.5 -ml-1 mr-2">
          <ChevronLeft size={18} color="#d4d4d8" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-[15px] font-semibold">配對對話</Text>
        </View>
      </View>

      {/* Meeting card */}
      {meeting && (
        <MeetingCard
          meeting={meeting}
          matchId={matchId!}
          userId={userId!}
          onCancel={() => {}}
          onUpdated={setMeeting}
        />
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          className="flex-1"
          contentContainerStyle={{ paddingVertical: 12 }}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          onContentSizeChange={() => {
            if (!loadingMore) flatRef.current?.scrollToEnd({ animated: false });
          }}
          ListHeaderComponent={
            hasMore ? (
              <Pressable onPress={loadMore} disabled={loadingMore} className="items-center py-3">
                {loadingMore
                  ? <ActivityIndicator color="#71717a" size="small" />
                  : <Text className="text-zinc-500 text-[12px]">載入更多訊息</Text>
                }
              </Pressable>
            ) : null
          }
        />

        {/* Input bar */}
        <View className="flex-row items-center px-4 py-3 border-t border-zinc-800 gap-2" style={{ borderTopWidth: 0.5 }}>
          <Pressable
            onPress={() => setShowSchedule(true)}
            className="h-9 w-9 rounded-full border border-zinc-700 items-center justify-center"
            style={{ borderWidth: 0.5 }}
          >
            <Calendar size={16} color="#a1a1aa" />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="訊息…"
            placeholderTextColor="#52525b"
            className="flex-1 bg-zinc-900 text-white rounded-full px-4 py-2 text-[14px] border border-zinc-800"
            style={{ borderWidth: 0.5 }}
            onSubmitEditing={send}
          />
          <Pressable
            onPress={send}
            className="h-9 w-9 rounded-full bg-white items-center justify-center"
          >
            <Send size={16} color="#000" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ScheduleModal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        onConfirm={createMeeting}
        loading={scheduleLoading}
      />
    </SafeAreaView>
  );
}
