import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const USER_CARD_SELECT = {
  id: true, email: true, role: true, gender: true, displayName: true,
  bio: true, interests: true, education: true, zodiac: true,
  jobTitle: true, company: true, school: true, city: true,
  height: true, avatarUrl: true,
};

@Injectable()
export class DiscoverService {
  constructor(private prisma: PrismaService) {}

  async updateLocation(userId: string, lat: number, lng: number) {
    await this.prisma.$executeRaw`
      UPDATE "User"
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${userId}
    `;
    return { ok: true };
  }

  async findNearby(
    userId: string,
    radius = 5,
    page = 1,
    limit = 20,
    genderFilter: string[] = [],
    roleFilter: string | null = null,
  ) {
    const offset = (page - 1) * limit;
    const radiusM = radius * 1000;
    const filterByGender = genderFilter.length > 0 && genderFilter.length < 3;
    const filterByRole = roleFilter !== null;
    const safeRole = roleFilter ?? 'OWNER';

    const userRows = await this.prisma.$queryRaw<{ hasLocation: boolean }[]>`
      SELECT (location IS NOT NULL) as "hasLocation" FROM "User" WHERE id = ${userId}
    `;
    if (!userRows[0]?.hasLocation) return [];

    const rows = await this.prisma.$queryRaw<{ id: string; distanceM: number }[]>`
      SELECT u.id, ST_Distance(u.location, me.location) as "distanceM"
      FROM "User" u
      JOIN "User" me ON me.id = ${userId}
      WHERE u.id != ${userId}
        AND me.location IS NOT NULL
        AND u.location IS NOT NULL
        AND ST_DWithin(u.location, me.location, ${radiusM})
        AND u.id NOT IN (
          SELECT "targetId" FROM "Swipe"
          WHERE "swiperId" = ${userId}
            AND (
              direction != 'PASS'
              OR "createdAt" > NOW() - (${parseInt(process.env.PASS_EXPIRY_MINUTES ?? '1')} || ' minutes')::interval
            )
        )
        AND (
          ${!filterByGender} OR u.gender::text = ANY(${genderFilter})
        )
        AND (
          ${!filterByRole} OR u.role::text = ${safeRole}
        )
      ORDER BY "distanceM" ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const distanceMap = new Map(rows.map((r) => [r.id, Number(r.distanceM)]));
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((r) => r.id) } },
      select: USER_CARD_SELECT,
    });

    return users
      .sort((a, b) => (distanceMap.get(a.id) ?? 0) - (distanceMap.get(b.id) ?? 0))
      .map((u) => ({ user: u, distanceM: distanceMap.get(u.id) ?? 0 }));
  }
}
