'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { UserRole } from '@pawpals/shared';

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; userId: string; role: UserRole }>(
        '/auth/login',
        { email: email.trim(), password },
      );
      setTokens(data.accessToken, data.userId, data.role);
      router.push('/swipe');
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'INVALID_CREDENTIALS') {
        setError('Email 或密碼錯誤');
      } else {
        toast.error('登入失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <Link href="/" className="font-mono text-[10px] tracking-widest uppercase text-zinc-500 hover:text-zinc-300">
            ← 返回
          </Link>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">歡迎回來</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {error && (
            <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">密碼</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-white text-black hover:bg-zinc-100 font-semibold">
            {loading ? '登入中…' : '登入'}
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-600">
          還沒有帳號？{' '}
          <Link href="/" className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors">
            選擇身份註冊
          </Link>
        </p>
      </div>
    </main>
  );
}
