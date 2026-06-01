import {
  ForbiddenException,
  Injectable,
  Inject,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { IsDateString, IsUUID } from 'class-validator';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ChatGateway } from '../chat/chat.gateway';
import { REDIS_CLIENT } from '../redis/redis.module';

export class CreateMeetingDto {
  @IsUUID()
  matchId: string;

  @IsDateString()
  scheduledAt: string;
}

@Injectable()
export class MeetingService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private chatGateway: ChatGateway,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async create(userId: string, dto: CreateMeetingDto) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt.getTime() - Date.now() < 30 * 60 * 1000) {
      throw new UnprocessableEntityException('SCHEDULE_TOO_SOON');
    }

    const match = await this.prisma.match.findUnique({ where: { id: dto.matchId } });
    if (!match) throw new NotFoundException('MATCH_NOT_FOUND');
    if (match.userAId !== userId && match.userBId !== userId) throw new ForbiddenException();

    await this.walletService.debitEscrow(userId, 5, dto.matchId);

    const meeting = await this.prisma.meeting.create({
      data: { matchId: dto.matchId, initiatorId: userId, scheduledAt, escrow: 5 },
    });

    this.chatGateway.server.to(`room:match-${dto.matchId}`).emit('meeting:updated', meeting);
    return meeting;
  }

  async cancel(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('MEETING_NOT_FOUND');

    const match = await this.prisma.match.findUnique({ where: { id: meeting.matchId } });
    if (!match) throw new NotFoundException();
    if (match.userAId !== userId && match.userBId !== userId) throw new ForbiddenException();

    const hoursUntil = (meeting.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
    const isBenign = hoursUntil > 2;
    const recipientId = meeting.initiatorId === userId
      ? (match.userAId === userId ? match.userBId : match.userAId)
      : meeting.initiatorId;

    if (isBenign) {
      await this.walletService.refundEscrow(meetingId, meeting.initiatorId, meeting.escrow);
    } else {
      await this.walletService.releaseEscrow(meetingId, recipientId, meeting.escrow);
    }

    const status = isBenign ? 'CANCELLED_BENIGN' : 'CANCELLED_PENALTY';
    const updated = await this.prisma.meeting.update({ where: { id: meetingId }, data: { status } });
    this.chatGateway.server.to(`room:match-${meeting.matchId}`).emit('meeting:updated', updated);
    return updated;
  }

  async getQr(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('MEETING_NOT_FOUND');
    if (meeting.initiatorId === userId) throw new ForbiddenException('INITIATOR_CANNOT_GET_QR');
    if (new Date() < meeting.scheduledAt) throw new UnprocessableEntityException('NOT_YET_TIME');

    const token = uuidv4();
    await this.redis.setex(`meeting:${meetingId}:totp`, 30, token);
    return { token, expiresIn: 30 };
  }

  async verify(meetingId: string, userId: string, token: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('MEETING_NOT_FOUND');
    if (meeting.initiatorId !== userId) throw new ForbiddenException('ONLY_INITIATOR_CAN_VERIFY');

    const stored = await this.redis.get(`meeting:${meetingId}:totp`);
    if (!stored) throw new UnprocessableEntityException('TOKEN_EXPIRED');

    const valid = crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(token));
    if (!valid) throw new UnprocessableEntityException('INVALID_TOKEN');

    const match = await this.prisma.match.findUnique({ where: { id: meeting.matchId } });
    const recipientId = match!.userAId === userId ? match!.userBId : match!.userAId;

    await this.walletService.releaseEscrow(meetingId, recipientId, meeting.escrow);
    await this.redis.del(`meeting:${meetingId}:totp`);

    const completed = await this.prisma.meeting.update({ where: { id: meetingId }, data: { status: 'COMPLETED' } });
    this.chatGateway.server.to(`room:match-${meeting.matchId}`).emit('meeting:updated', completed);
    return completed;
  }
}
