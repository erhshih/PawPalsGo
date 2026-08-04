import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const staleUsers = await prisma.user.updateMany({
    where: { avatarUrl: { startsWith: '/uploads/' } },
    data: { avatarUrl: null },
  });
  console.log(`Cleared avatarUrl on ${staleUsers.count} users`);

  const stalePhotos = await prisma.photo.deleteMany({
    where: { url: { startsWith: '/uploads/' } },
  });
  console.log(`Deleted ${stalePhotos.count} stale pet photos`);

  const stalePostPhotos = await prisma.postPhoto.deleteMany({
    where: { url: { startsWith: '/uploads/' } },
  });
  console.log(`Deleted ${stalePostPhotos.count} stale post photos`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
