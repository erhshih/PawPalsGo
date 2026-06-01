import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div>
          <p className="font-mono text-[10px] tracking-widest uppercase text-zinc-500">pawpals</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Go.<span className="text-zinc-600 font-light italic"> 毛孩的緣分</span>
          </h1>
          <p className="mt-3 text-sm text-zinc-400">選擇你的身份，開始你的旅程</p>
        </div>

        <div className="space-y-3">
          <Link href="/register?role=OWNER" className="block">
            <Button className="w-full h-14 rounded-2xl bg-white text-black hover:bg-zinc-100 text-sm font-semibold">
              <span className="font-mono text-[10px] tracking-widest mr-3 text-zinc-400">01</span>
              我是飼主，我有毛孩
            </Button>
          </Link>
          <Link href="/register?role=LOVER" className="block">
            <Button variant="outline" className="w-full h-14 rounded-2xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-sm font-semibold text-white">
              <span className="font-mono text-[10px] tracking-widest mr-3 text-zinc-600">02</span>
              我是貓狗奴，超愛毛孩
            </Button>
          </Link>
        </div>

        <p className="text-xs text-zinc-600">
          已有帳號？{' '}
          <Link href="/login" className="text-zinc-400 underline underline-offset-2 hover:text-white transition-colors">
            登入
          </Link>
        </p>
      </div>
    </main>
  );
}
