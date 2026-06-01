'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">step 02 · profile</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">照片驗證</h1>
          <p className="mt-2 text-sm text-zinc-400">Web 版暫不支援照片上傳，請使用 App 完成驗證</p>
        </div>

        <div className="rounded-xl border border-zinc-800 px-4 py-3 flex gap-3 bg-zinc-900/40 text-left">
          <ShieldCheck size={16} className="text-white mt-0.5 shrink-0" />
          <p className="text-xs text-zinc-400 leading-relaxed">
            照片用於人工 + AI 真人驗證。通過後顯示「<span className="text-white">已驗證</span>」徽章。
          </p>
        </div>

        <Button
          onClick={() => router.push('/swipe')}
          className="w-full h-12 rounded-2xl bg-white text-black hover:bg-zinc-100 font-semibold"
        >
          先進入探索
          <ArrowRight size={14} className="ml-2" />
        </Button>
      </div>
    </main>
  );
}
