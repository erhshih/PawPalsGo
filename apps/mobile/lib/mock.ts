import { PetDto, MatchDto } from '@pawpals/shared';

export const MOCK_PETS: PetDto[] = [
  {
    id: 'mock-1',
    ownerId: 'owner-1',
    name: 'Mochi',
    breed: '柴犬 · 2 歲',
    bio: '喜歡在公園曬太陽，跟誰都能在五分鐘內變成熟人。最愛被摸耳朵，肚子可以揉一整天。',
    tags: ['活潑', '友善', '訓練良好', '愛散步'],
    photos: [
      { id: 'p1', url: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=600&h=800&fit=crop', kind: 'closeup', sortOrder: 0 },
      { id: 'p2', url: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=800&fit=crop', kind: 'owner', sortOrder: 1 },
    ],
  },
  {
    id: 'mock-2',
    ownerId: 'owner-2',
    name: 'Luna',
    breed: '波斯貓 · 3 歲',
    bio: '高冷外表下藏著一顆熱情的心。只要給她零食，馬上變世界上最甜的貓。',
    tags: ['高冷', '獨立', '偶爾撒嬌', '愛睡覺'],
    photos: [
      { id: 'p3', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=800&fit=crop', kind: 'closeup', sortOrder: 0 },
    ],
  },
  {
    id: 'mock-3',
    ownerId: 'owner-3',
    name: 'Koda',
    breed: '黃金獵犬 · 4 歲',
    bio: '天生的好朋友！愛游泳、愛追球，任何地點都能玩出一百種花樣。',
    tags: ['外向', '親人', '愛運動', '適合遛狗'],
    photos: [
      { id: 'p4', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=800&fit=crop', kind: 'closeup', sortOrder: 0 },
      { id: 'p5', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=800&fit=crop', kind: 'bw', sortOrder: 1 },
    ],
  },
  {
    id: 'mock-4',
    ownerId: 'owner-4',
    name: 'Pistachio',
    breed: '法國鬥牛犬 · 1.5 歲',
    bio: '有個性的小傢伙，最愛窩在沙發曬太陽。熟了之後超黏人，會一直蹭你的腳。',
    tags: ['慵懶', '保守', '熟了超甜'],
    photos: [
      { id: 'p6', url: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?w=600&h=800&fit=crop', kind: 'closeup', sortOrder: 0 },
    ],
  },
  {
    id: 'mock-5',
    ownerId: 'owner-5',
    name: 'Niko',
    breed: '邊境牧羊犬 · 2.5 歲',
    bio: '聰明過頭，無聊了會自己拆家。需要大量運動和智力遊戲，適合一起跑步的主人！',
    tags: ['超聰明', '精力旺盛', '愛學新把戲'],
    photos: [
      { id: 'p7', url: 'https://images.unsplash.com/photo-1590419690008-905895e8fe0d?w=600&h=800&fit=crop', kind: 'closeup', sortOrder: 0 },
    ],
  },
];

export const MOCK_MATCHES: MatchDto[] = [
  {
    id: 'match-1',
    partner: { id: 'owner-1', email: 'mochi.lover@example.com', role: 'OWNER', pets: [MOCK_PETS[0]] },
    unreadCount: 2,
    lastMessage: {
      id: 'msg-1',
      matchId: 'match-1',
      senderId: 'owner-1',
      text: '你好！想約個時間帶 Mochi 去公園認識一下 🐾',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'match-2',
    partner: { id: 'owner-3', email: 'koda.fan@example.com', role: 'OWNER', pets: [MOCK_PETS[2]] },
    unreadCount: 0,
    lastMessage: {
      id: 'msg-2',
      matchId: 'match-2',
      senderId: 'dev-user-id',
      text: '週末有空嗎？Koda 最近很想去河堤跑步！',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 'match-3',
    partner: { id: 'owner-2', email: 'luna.parent@example.com', role: 'OWNER', pets: [MOCK_PETS[1]] },
    unreadCount: 1,
    lastMessage: {
      id: 'msg-3',
      matchId: 'match-3',
      senderId: 'owner-2',
      text: 'Luna 其實很愛新朋友，只是要給她一點時間 😺',
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];
