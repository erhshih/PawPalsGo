import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';

const ORGANIZER_SELECT = { id: true, displayName: true, avatarUrl: true, city: true };
const ATTENDEE_SELECT = {
  id: true,
  userId: true,
  petId: true,
  joinedAt: true,
  user: { select: ORGANIZER_SELECT },
  pet: { select: { id: true, name: true, breed: true } },
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
export class DogMeetupsService {
  constructor(private prisma: PrismaService) {}

  async create(organizerId: string, dto: CreateMeetupDto) {
    if (new Date(dto.scheduledAt).getTime() <= Date.now()) {
      throw new UnprocessableEntityException('SCHEDULED_AT_MUST_BE_FUTURE');
    }

    return this.prisma.dogMeetup.create({
      data: {
        organizerId,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        latitude: dto.latitude,
        longitude: dto.longitude,
        scheduledAt: new Date(dto.scheduledAt),
        maxAttendees: dto.maxAttendees,
        attendees: { create: { userId: organizerId } },
      },
      include: { organizer: { select: ORGANIZER_SELECT }, attendees: { select: ATTENDEE_SELECT } },
    });
  }

  async join(meetupId: string, userId: string, petId?: string) {
    const meetup = await this.prisma.dogMeetup.findUnique({
      where: { id: meetupId },
      include: { _count: { select: { attendees: true } } },
    });
    if (!meetup || meetup.cancelledAt) throw new NotFoundException('MEETUP_NOT_FOUND');
    if (meetup.scheduledAt.getTime() <= Date.now()) throw new UnprocessableEntityException('MEETUP_ALREADY_STARTED');
    if (meetup.maxAttendees && meetup._count.attendees >= meetup.maxAttendees) {
      throw new UnprocessableEntityException('MEETUP_FULL');
    }
    if (petId) {
      const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
      if (!pet || pet.ownerId !== userId) throw new ForbiddenException('PET_NOT_OWNED');
    }

    await this.prisma.dogMeetupAttendee.upsert({
      where: { meetupId_userId: { meetupId, userId } },
      create: { meetupId, userId, petId },
      update: { petId },
    });
    return { ok: true };
  }

  async leave(meetupId: string, userId: string) {
    const meetup = await this.prisma.dogMeetup.findUnique({ where: { id: meetupId } });
    if (!meetup) throw new NotFoundException('MEETUP_NOT_FOUND');
    if (meetup.organizerId === userId) throw new ForbiddenException('ORGANIZER_MUST_CANCEL_INSTEAD');

    await this.prisma.dogMeetupAttendee.deleteMany({ where: { meetupId, userId } });
    return { ok: true };
  }

  async cancel(meetupId: string, organizerId: string) {
    const meetup = await this.prisma.dogMeetup.findUnique({ where: { id: meetupId } });
    if (!meetup) throw new NotFoundException('MEETUP_NOT_FOUND');
    if (meetup.organizerId !== organizerId) throw new ForbiddenException();

    return this.prisma.dogMeetup.update({ where: { id: meetupId }, data: { cancelledAt: new Date() } });
  }

  /** 只顯示附近、還沒開始、沒被取消的揪團，依時間排序（快到的優先），不是全域列表。 */
  async getNearby(userId: string, radiusKm = 10, page = 1, limit = 20) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });
    if (!me?.latitude || !me?.longitude) return [];

    const meetups = await this.prisma.dogMeetup.findMany({
      where: {
        cancelledAt: null,
        scheduledAt: { gt: new Date() },
        latitude: { not: null },
        longitude: { not: null },
      },
      include: { organizer: { select: ORGANIZER_SELECT }, _count: { select: { attendees: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    const radiusM = radiusKm * 1000;
    const withDistance = meetups
      .map((m) => ({ meetup: m, distanceM: haversineM(me.latitude!, me.longitude!, m.latitude!, m.longitude!) }))
      .filter((m) => m.distanceM <= radiusM);

    const offset = (page - 1) * limit;
    return withDistance
      .slice(offset, offset + limit)
      .map(({ meetup, distanceM }) => ({ ...meetup, distanceM }));
  }

  async getOne(meetupId: string) {
    const meetup = await this.prisma.dogMeetup.findUnique({
      where: { id: meetupId },
      include: { organizer: { select: ORGANIZER_SELECT }, attendees: { select: ATTENDEE_SELECT } },
    });
    if (!meetup) throw new NotFoundException('MEETUP_NOT_FOUND');
    return meetup;
  }
}
