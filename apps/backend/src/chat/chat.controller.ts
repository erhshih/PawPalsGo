import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { REDIS_CLIENT } from '../redis/redis.module';
import { ChatGateway } from './chat.gateway';
import { SafetyService } from '../safety/safety.service';
import type { RequestUser } from '../auth/jwt.strategy';

class SendMessageDto {
  @IsString()
  @MinLength(1)
  text: string;
}

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private chatGateway: ChatGateway,
    private safetyService: SafetyService,
  ) {}

  @Get(':matchId/meeting')
  async getActiveMeeting(@Param('matchId') matchId: string, @Req() req: { user: RequestUser }) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.userAId !== req.user.userId && match.userBId !== req.user.userId)) {
      throw new ForbiddenException();
    }
    return this.prisma.meeting.findFirst({
      where: { matchId, status: 'SCHEDULED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':matchId/messages')
  async getMessages(
    @Param('matchId') matchId: string,
    @Req() req: { user: RequestUser },
    @Query('before') before?: string,
    @Query('limit') limit = '20',
  ) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.userAId !== req.user.userId && match.userBId !== req.user.userId)) {
      throw new ForbiddenException();
    }
    return this.prisma.message.findMany({
      where: {
        matchId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });
  }

  @Post(':matchId/messages')
  async sendMessage(
    @Param('matchId') matchId: string,
    @Body() dto: SendMessageDto,
    @Req() req: { user: RequestUser },
  ) {
    const userId = req.user.userId;
    const match = await this.prisma.match.findUniqueOrThrow({ where: { id: matchId } });

    const recipientIdForCheck = match.userAId === userId ? match.userBId : match.userAId;
    await this.safetyService.assertNotBlocked(userId, recipientIdForCheck);

    const message = await this.prisma.message.create({
      data: { matchId, senderId: userId, text: dto.text },
    });

    const recipientId = match.userAId === userId ? match.userBId : match.userAId;
    const unreadKey = `unread:${matchId}:${recipientId}`;
    await this.redis.incr(unreadKey);
    await this.redis.expire(unreadKey, 30 * 24 * 60 * 60);

    // 即時推播給 socket 房間裡的人
    this.chatGateway.server.to(`room:match-${matchId}`).emit('chat:message', message);

    return message;
  }

  @Post(':matchId/read')
  async markRead(@Param('matchId') matchId: string, @Req() req: { user: RequestUser }) {
    const userId = req.user.userId;
    await this.redis.del(`unread:${matchId}:${userId}`);
    // 通知房間裡的人「這個 userId 已讀了」
    this.chatGateway.server.to(`room:match-${matchId}`).emit('chat:read', { userId, readAt: new Date().toISOString() });
    return { ok: true };
  }
}
