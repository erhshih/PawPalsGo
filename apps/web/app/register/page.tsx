'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { UserRole, Gender } from '@pawpals/shared';
import { Suspense } from 'react';

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get('role') as UserRole;
  const { setTokens } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (!email.includes('@')) e.email = '請輸入有效的 Email';
    if (password.length < 8) e.password = '密碼至少 8 個字元';
    if (password !== confirm) e.confirm = '密碼不一致';
    if (!gender) e.gender = '請選擇性別';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post<{ accessToken: string; userId: string }>(
        '/auth/register',
        { email: email.trim(), password, role, gender },
      );
      setTokens(data.accessToken, data.userId, role);
      router.push('/onboarding');
    } catch (err: any) {
      const code = err?.response?.data?.code;
      if (code === 'EMAIL_TAKEN') {
        setErrors({ email: '此 Email 已被使用' });
      } else {
        toast.error('註冊失敗，請稍後再試');
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
          <p className="mt-4 font-mono text-[10px] tracking-widest uppercase text-zinc-500">
            {role === 'OWNER' ? '01 / 飼主' : '02 / 貓狗奴'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">建立帳號</h1>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Gender */}
          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">性別</Label>
            <div className="flex gap-2">
              {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => {
                const label = g === 'MALE' ? '男' : g === 'FEMALE' ? '女' : '其他';
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 h-11 rounded-xl text-sm font-semibold transition-colors ${
                      gender === g ? 'bg-white text-black' : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {errors.gender && <p className="text-xs text-red-400">{errors.gender}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
            />
            {errors.email && <p className="text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">密碼</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
            />
            {errors.password && <p className="text-xs text-red-400">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <Label className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">確認密碼</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white h-12 rounded-xl"
            />
            {errors.confirm && <p className="text-xs text-red-400">{errors.confirm}</p>}
          </div>

          <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl bg-white text-black hover:bg-zinc-100 font-semibold">
            {loading ? '建立中…' : '建立帳號'}
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
