'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PostDto } from '@pawpals/shared';
import { ChevronLeft, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

export default function CreatePostPage() {
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function submit() {
    if (!caption.trim() && !photoFile) { toast.error('請至少輸入文字或選擇照片'); return; }
    setSubmitting(true);
    try {
      const { data: post } = await api.post<PostDto>('/posts', { caption: caption.trim() || undefined });
      if (photoFile) {
        const form = new FormData();
        form.append('file', photoFile);
        await api.post(`/posts/${post.id}/photos`, form);
      }
      router.push('/feed');
    } catch {
      toast.error('發布失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">新貼文</span>
        <button onClick={submit} disabled={submitting} className="text-sm font-semibold text-white disabled:text-zinc-600 px-1.5">
          {submitting ? '發布中…' : '發布'}
        </button>
      </div>

      <div className="p-4">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value.slice(0, 300))}
          placeholder="分享你和毛孩的日常..."
          rows={4}
          className="w-full bg-transparent text-white text-base leading-relaxed resize-none focus:outline-none placeholder:text-zinc-600"
        />
        <p className="text-right text-xs text-zinc-600 mb-4">{caption.length}/300</p>

        {photoPreview ? (
          <button onClick={() => fileRef.current?.click()} className="block w-full rounded-2xl overflow-hidden">
            <img src={photoPreview} alt="" className="w-full h-64 object-cover" />
          </button>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-2xl border border-dashed border-zinc-800 py-10 flex flex-col items-center gap-2 bg-zinc-900 hover:border-zinc-700 transition-colors"
          >
            <ImagePlus size={22} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">新增一張照片（選填）</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
      </div>
    </div>
  );
}
