import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SafetyService } from '../safety/safety.service';

const USER_CARD_SELECT = {
  id: true, email: true, role: true, gender: true, displayName: true,
  bio: true, interests: true, education: true, zodiac: true,
  jobTitle: true, company: true, school: true, city: true,
  height: true, avatarUrl: true,
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class DiscoverService {
  constructor(
    private prisma: PrismaService,
    private safetyService: SafetyService,
  ) {}

  async updateLocation(userId: string, lat: number, lng: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { latitude: lat, longitude: lng },
    });
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
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });
    if (!me?.latitude || !me?.longitude) return [];

    const passExpiryMinutes = parseInt(process.env.PASS_EXPIRY_MINUTES ?? '1');
    const passExpiryDate = new Date(Date.now() - passExpiryMinutes * 60 * 1000);

    const swipes = await this.prisma.swipe.findMany({
      where: {
        swiperId: userId,
        OR: [
          { direction: { not: 'PASS' as any } },
          { direction: 'PASS' as any, createdAt: { gt: passExpiryDate } },
        ],
      },
      select: { targetId: true },
    });
    const swipedIds = swipes.map((s) => s.targetId);
    const blockedIds = await this.safetyService.getBlockedUserIds(userId);

    const where: Prisma.UserWhereInput = {
      id: { not: userId, notIn: [...swipedIds, ...blockedIds] },
      latitude: { not: null },
      longitude: { not: null },
      ...(genderFilter.length > 0 && genderFilter.length < 3
        ? { gender: { in: genderFilter as any } }
        : {}),
      ...(roleFilter !== null ? { role: roleFilter as any } : {}),
    };

    const candidates = await this.prisma.user.findMany({
      where,
      select: { ...USER_CARD_SELECT, latitude: true, longitude: true },
    });

    const radiusM = radius * 1000;
    const withDistance = candidates
      .map((u) => ({
        user: u,
        distanceM: haversineM(me.latitude!, me.longitude!, u.latitude!, u.longitude!),
      }))
      .filter((u) => u.distanceM <= radiusM)
      .sort((a, b) => a.distanceM - b.distanceM);

    const offset = (page - 1) * limit;
    return withDistance.slice(offset, offset + limit).map(({ user, distanceM }) => {
      const { latitude, longitude, ...rest } = user;
      return { user: rest, distanceM };
    });
  }
}
