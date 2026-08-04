'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { PostDto, PostCommentDto, TipperDto, TIP_AMOUNTS } from '@pawpals/shared';
import { ChevronLeft, Heart, Beef, User, Flag, Trash2, Send, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const router = useRouter();
  const { userId } = useAuthStore();
  const { balance, deductBalance } = useWalletStore();

  const [post, setPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<PostCommentDto[]>([]);
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showTip, setShowTip] = useState(false);
  const [tippers, setTippers] = useState<TipperDto[] | null>(null);

  useEffect(() => {
    if (!postId) return;
    api.get<PostDto>(`/posts/${postId}`).then(({ data }) => setPost(data)).catch(() => {});
    api.get<PostCommentDto[]>(`/posts/${postId}/comments`).then(({ data }) => setComments(data)).catch(() => {});
  }, [postId]);

  const isAuthor = post && userId === post.authorId;

  async function toggleLike() {
    if (!post) return;
    try {
      if (liked) {
        await api.delete(`/posts/${postId}/like`);
        setPost({ ...post, likeCount: Math.max(0, post.likeCount - 1) });
      } else {
        await api.post(`/posts/${postId}/like`);
        setPost({ ...post, likeCount: post.likeCount + 1 });
      }
      setLiked(!liked);
    } catch {}
  }

  async function submitComment() {
    if (!commentText.trim() || !post) return;
    const text = commentText.trim();
    setCommentText('');
    try {
      const { data } = await api.post<PostCommentDto>(`/posts/${postId}/comments`, { text });
      setComments((c) => [data, ...c]);
      setPost({ ...post, commentCount: post.commentCount + 1 });
    } catch {
      toast.error('留言失敗，請稍後再試');
    }
  }

  async function tip(amount: number) {
    if (!post) return;
    if (balance < amount) { toast.error('肉乾不足，請先儲值'); setShowTip(false); return; }
    try {
      await api.post(`/posts/${postId}/tip`, { amount });
      deductBalance(amount);
      setPost({ ...post, tipCount: post.tipCount + 1 });
      setShowTip(false);
      toast.success(`🦴 已抖內 ${amount} 塊肉乾！`);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      toast.error(msg === 'CANNOT_TIP_OWN_POST' ? '不能抖內自己的貼文' : '抖內失敗，請稍後再試');
      setShowTip(false);
    }
  }

  async function loadTippers() {
    try {
      const { data } = await api.get<TipperDto[]>(`/posts/${postId}/tippers`);
      setTippers(data);
    } catch {
      toast.error('無法讀取打賞名單');
    }
  }

  async function deletePost() {
    if (!confirm('確定要刪除這則貼文嗎？')) return;
    try {
      await api.delete(`/posts/${postId}`);
      router.push('/feed');
    } catch {
      toast.error('刪除失敗，請稍後再試');
    }
  }

  function reportPost() {
    if (!post) return;
    router.push(`/report?targetId=${post.authorId}&postId=${post.id}`);
  }

  if (!post) return null;

  const avatarUri = toPhotoUri(post.author?.avatarUrl);

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/60 shrink-0">
        <button onClick={() => router.back()} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={20} />
        </button>
        <span className="text-base font-semibold text-white">貼文</span>
        <button onClick={isAuthor ? deletePost : reportPost} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
          {isAuthor ? <Trash2 size={18} className="text-red-500" /> : <Flag size={18} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="flex items-center gap-2.5 p-4">
        {avatarUri ? (
          <img src={avatarUri} alt="" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <User size={18} className="text-zinc-600" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-white">{post.author?.displayName || '毛孩爸媽'}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{post.author?.city || ''}</p>
        </div>
      </div>

      {post.photos?.length > 0 && (
        <div className="flex gap-1 overflow-x-auto snap-x snap-mandatory">
          {post.photos.map((photo) => (
            <img
              key={photo.id}
              src={toPhotoUri(photo.url)!}
              alt=""
              className="w-full aspect-square object-cover shrink-0 snap-center"
            />
          ))}
        </div>
      )}

      {post.caption && <p className="text-sm text-zinc-200 leading-relaxed px-4 pt-3.5">{post.caption}</p>}

      <div className="flex items-center gap-5 p-4">
        <button onClick={toggleLike} className="flex items-center gap-1.5">
          <Heart size={20} className={liked ? 'text-red-500' : 'text-zinc-400'} fill={liked ? '#ef4444' : 'none'} />
          <span className="text-sm text-zinc-400">{post.likeCount}</span>
        </button>
        <button onClick={() => setShowTip(true)} className="flex items-center gap-1.5">
          <Beef size={20} className="text-orange-500" />
          <span className="text-sm text-orange-500">抖內{post.tipCount > 0 ? ` (${post.tipCount})` : ''}</span>
        </button>
        {isAuthor && (
          <button onClick={loadTippers} className="flex items-center gap-1.5">
            <UsersIcon size={18} className="text-zinc-400" />
            <span className="text-sm text-zinc-400">打賞名單</span>
          </button>
        )}
      </div>

      {tippers && (
        <div className="mx-4 mb-4 rounded-xl bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-2.5">打賞名單 · 個人介紹已解鎖</p>
          {tippers.length === 0 ? (
            <p className="text-sm text-zinc-600">還沒有人抖內</p>
          ) : (
            tippers.map((t, i) => (
              <div key={i} className="flex justify-between items-start py-1.5">
                <div>
                  <p className="text-sm font-semibold text-white">{t.sender.displayName || t.sender.email}</p>
                  {t.sender.bio && <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{t.sender.bio}</p>}
                </div>
                <span className="text-sm font-semibold text-orange-500 shrink-0 ml-2">{t.amount} 🦴</span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="border-t border-zinc-800/60 pt-3">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500 px-4 mb-2">
          留言 {comments.length > 0 ? `(${comments.length})` : ''}
        </p>
        {comments.length === 0 ? (
          <p className="text-sm text-zinc-600 px-4">還沒有留言</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="px-4 py-2">
              <p className="text-sm text-zinc-200 leading-relaxed">{c.text}</p>
            </div>
          ))
        )}
      </div>
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
          placeholder="留言..."
          className="flex-1 bg-zinc-900 rounded-full px-4 py-2.5 text-sm text-white focus:outline-none placeholder:text-zinc-600"
        />
        <button onClick={submitComment} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-zinc-100 transition-colors">
          <Send size={16} className="text-black" />
        </button>
      </div>

      {/* Tip modal */}
      {showTip && (
        <div className="absolute inset-0 bg-black/70 flex items-end z-50" onClick={() => setShowTip(false)}>
          <div className="w-full max-w-lg mx-auto bg-zinc-900 rounded-t-3xl p-5 pb-8 border-t border-zinc-800" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
            <div className="flex items-center gap-3 mb-5">
              <div className="rounded-full bg-zinc-300 p-2.5">
                <Beef size={18} className="text-zinc-900" />
              </div>
              <div>
                <p className="text-[10px] font-mono tracking-widest uppercase text-zinc-500">tip this post</p>
                <p className="text-lg font-semibold text-white">抖內肉乾給這則貼文</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {TIP_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => tip(amt)}
                  className="rounded-xl border border-zinc-800 bg-black/40 py-4 text-white text-lg font-bold hover:border-zinc-600 transition-colors"
                >
                  {amt} 🦴
                </button>
              ))}
            </div>
            <p className="mt-3.5 text-xs text-zinc-500 text-center">抖內後，貼文作者會看到你的個人介紹</p>
          </div>
        </div>
      )}
    </div>
  );
}
