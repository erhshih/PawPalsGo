import { PrismaClient, UserRole, PhotoKind } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Near Taipei (25.0330N, 121.5654E)
const LOCATIONS = [
  { lat: 25.0335, lng: 121.5660 },
  { lat: 25.0340, lng: 121.5672 },
  { lat: 25.0380, lng: 121.5700 },
  { lat: 25.0280, lng: 121.5620 },
  { lat: 25.0420, lng: 121.5580 },
];

async function setLocation(userId: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE "User"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${userId}
  `;
}

async function seed() {
  console.log('🌱 Seeding...');
  const HASH = await bcrypt.hash('password123', 10);

  await prisma.message.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();

  // --- OWNER users ---
  const owners = await Promise.all([
    prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: 'mochi.owner@test.com', passwordHash: HASH, role: UserRole.OWNER },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 100 } });
      return u;
    }),
    prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: 'luna.owner@test.com', passwordHash: HASH, role: UserRole.OWNER },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 50 } });
      return u;
    }),
    prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: 'koda.owner@test.com', passwordHash: HASH, role: UserRole.OWNER },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 200 } });
      return u;
    }),
  ]);

  // --- LOVER users ---
  const lovers = await Promise.all([
    prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: 'lover1@test.com', passwordHash: HASH, role: UserRole.LOVER },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 30 } });
      return u;
    }),
    prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: 'lover2@test.com', passwordHash: HASH, role: UserRole.LOVER },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 0 } });
      return u;
    }),
  ]);

  // Set locations (all within 5km of Taipei center)
  const allUsers = [...owners, ...lovers];
  await Promise.all(allUsers.map((u, i) => setLocation(u.id, LOCATIONS[i].lat, LOCATIONS[i].lng)));

  // --- Pets ---
  const petData = [
    {
      ownerId: owners[0].id,
      name: 'Mochi',
      breed: '柴犬 · 2 歲',
      bio: '喜歡在公園曬太陽，跟誰都能在五分鐘內變成熟人。最愛被摸耳朵，肚子可以揉一整天。',
      tags: ['活潑', '友善', '訓練良好', '愛散步'],
      photos: [
        { url: 'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=600&h=800&fit=crop', kind: PhotoKind.closeup, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=800&fit=crop', kind: PhotoKind.owner, sortOrder: 1 },
      ],
    },
    {
      ownerId: owners[1].id,
      name: 'Luna',
      breed: '波斯貓 · 3 歲',
      bio: '高冷外表下藏著一顆熱情的心。只要給她零食，馬上變世界上最甜的貓。',
      tags: ['高冷', '獨立', '偶爾撒嬌', '愛睡覺'],
      photos: [
        { url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=800&fit=crop', kind: PhotoKind.closeup, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=800&fit=crop', kind: PhotoKind.bw, sortOrder: 1 },
      ],
    },
    {
      ownerId: owners[2].id,
      name: 'Koda',
      breed: '黃金獵犬 · 4 歲',
      bio: '天生的好朋友！愛游泳、愛追球，任何地點都能玩出一百種花樣。',
      tags: ['外向', '親人', '愛運動', '適合遛狗'],
      photos: [
        { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=800&fit=crop', kind: PhotoKind.closeup, sortOrder: 0 },
        { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=800&fit=crop', kind: PhotoKind.bw, sortOrder: 1 },
      ],
    },
  ];

  for (const pd of petData) {
    const { photos, ...rest } = pd;
    const pet = await prisma.pet.create({ data: rest });
    await prisma.photo.createMany({
      data: photos.map((ph) => ({ ...ph, petId: pet.id })),
    });
  }

  console.log('✅ Seed done!');
  console.log('  OWNER accounts: mochi.owner@test.com / luna.owner@test.com / koda.owner@test.com');
  console.log('  LOVER accounts: lover1@test.com / lover2@test.com');
  console.log('  All passwords: password123');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
