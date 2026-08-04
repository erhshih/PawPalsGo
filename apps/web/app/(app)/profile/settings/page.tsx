'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { UserDto } from '@pawpals/shared';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { toast } from 'sonner';

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-zinc-500 tracking-widest uppercase px-4 pt-6 pb-2">{title}</p>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">{children}</div>
  );
}

function SettingRow({ label, value, onClick, last }: {
  label: string; value?: string; onClick?: () => void; last?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-4 hover:bg-zinc-800/60 transition-colors ${!last ? 'border-b border-zinc-800' : ''}`}
    >
      <span className="text-sm text-zinc-200">{label}</span>
      <div className="flex items-center gap-1.5">
        {value && <span className="text-sm text-zinc-500">{value}</span>}
        <ChevronRight size={15} className="text-zinc-700" />
      </div>
    </button>
  );
}

export default function WebSettingsPage() {
  const router = useRouter();
  const { clearTokens } = useAuthStore();
  const [profile, setProfile] = useState<UserDto | null>(null);

  useEffect(() => {
    api.get<UserDto>('/users/me').then(({ data }) => setProfile(data)).catch(() => {});
  }, []);

  function logout() {
    if (!confirm('確定要登出嗎？')) return;
    api.post('/auth/logout').catch(() => {});
    clearTokens();
    router.push('/login');
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">設定</span>
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <Check size={16} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* 帳號設定 */}
      <SectionHeader title="帳號設定" />
      <Card>
        <SettingRow label="電子郵件" value={profile?.email ?? '—'} />
        <SettingRow label="已連結的帳號" onClick={() => toast.info('功能即將推出')} last />
      </Card>

      {/* 探索設定 */}
      <SectionHeader title="探索設定" />
      <Card>
        <SettingRow
          label="探索設定"
          value="距離、性別…"
          onClick={() => router.push('/profile/discover-settings')}
          last
        />
      </Card>

      {/* 通知 */}
      <SectionHeader title="通知" />
      <Card>
        <SettingRow label="推播通知" onClick={() => toast.info('功能即將推出')} />
        <SettingRow label="電子郵件通知" onClick={() => toast.info('功能即將推出')} last />
      </Card>

      {/* 隱私 */}
      <SectionHeader title="隱私" />
      <Card>
        <SettingRow label="隱私偏好設定" onClick={() => toast.info('功能即將推出')} />
        <SettingRow label="封鎖名單" onClick={() => router.push('/profile/blocked')} last />
      </Card>

      {/* 法務 */}
      <SectionHeader title="法務" />
      <Card>
        <SettingRow label="服務條款" onClick={() => toast.info('功能即將推出')} />
        <SettingRow label="隱私政策" onClick={() => toast.info('功能即將推出')} last />
      </Card>

      {/* 登出 */}
      <div className="mx-4 mt-8">
        <button
          onClick={logout}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          登出
        </button>
      </div>

      <p className="text-center text-zinc-700 text-xs font-mono mt-5">PawPals Go · v1.0.0</p>

      <div className="mx-4 mt-4">
        <button
          onClick={() => toast.error('帳號刪除功能即將推出')}
          className="w-full bg-zinc-900 border border-red-900/40 rounded-xl py-4 text-red-500 text-sm font-semibold hover:bg-zinc-800 transition-colors"
        >
          刪除帳號
        </button>
      </div>
    </div>
  );
}
