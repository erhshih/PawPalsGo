'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useDiscoverPrefs } from '@/stores/discoverPrefs';
import { PostDto } from '@pawpals/shared';
import { Heart, MessageCircle, Beef, Plus, PawPrint, User } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function toPhotoUri(url?: string | null) {
  if (!url) return null;
  return url.startsWith('http') ? url : `${API_URL}${url}`;
}

function distLabel(m?: number) {
  if (m == null) return null;
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function PostCard({ post }: { post: PostDto }) {
  const cover = toPhotoUri(post.photos?.[0]?.url);
  const avatarUri = toPhotoUri(post.author?.avatarUrl);
  const name = post.author?.displayName || '毛孩爸媽';

  return (
    <Link
      href={`/feed/${post.id}`}
      className="block rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-center gap-2.5 p-3">
        {avatarUri ? (
          <img src={avatarUri} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
            <User size={16} className="text-zinc-600" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{name}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {[post.author?.city, distLabel(post.distanceM)].filter(Boolean).join(' · ') || '附近'}
          </p>
        </div>
      </div>

      {cover && <img src={cover} alt="" className="w-full h-56 object-cover" />}

      {post.caption && (
        <p className="text-sm text-zinc-200 leading-relaxed px-3.5 pt-2.5 line-clamp-3">{post.caption}</p>
      )}

      <div className="flex items-center gap-4 p-3.5 pt-2.5">
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Heart size={14} /> {post.likeCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <MessageCircle size={14} /> {post.commentCount}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-orange-500">
          <Beef size={14} /> {post.tipCount}
        </span>
      </div>
    </Link>
  );
}

export default function FeedPage() {
  const router = useRouter();
  const { radius } = useDiscoverPrefs();
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<PostDto[]>('/posts/feed', { params: { radius: Math.min(radius, 50), limit: 30 } })
      .then(({ data }) => setPosts(data))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [radius]);

  return (
    <div className="max-w-lg mx-auto pt-4 px-4 pb-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-white">動態</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/meetup')}
            className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            <PawPrint size={16} className="text-zinc-300" />
          </button>
          <button
            onClick={() => router.push('/feed/create')}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-zinc-100 transition-colors"
          >
            <Plus size={18} className="text-black" strokeWidth={2.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {posts.map((p) => <PostCard key={p.id} post={p} />)}
      </div>

      {loaded && posts.length === 0 && (
        <div className="flex flex-col items-center pt-24 text-center">
          <p className="text-zinc-500 text-sm">附近還沒有貼文</p>
          <p className="text-zinc-600 text-xs mt-1.5">當第一個分享毛孩日常的人吧！</p>
        </div>
      )}
    </div>
  );
}
