import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class SwipeService {
  constructor(
    private prisma: PrismaService,
    @Inject(REDIS_CLIENT) private redis: Redis,
    private chatGateway: ChatGateway,
  ) {}

  async swipe(swiperId: string, targetUserId: string, direction: string) {
    await this.prisma.swipe.upsert({
      where: { swiperId_targetId: { swiperId, targetId: targetUserId } },
      create: { swiperId, targetId: targetUserId, direction: direction as any },
      update: { direction: direction as any },
    });

    if (direction === 'LIKE' || direction === 'SUPER_LIKE') {
      const likesKey = `user:${swiperId}:likes`;
      await this.redis.sadd(likesKey, targetUserId);
      await this.redis.expire(likesKey, 90 * 24 * 60 * 60);
      const theyLikedMe = await this.redis.sismember(`user:${targetUserId}:likes`, swiperId);

      if (theyLikedMe) {
        const [userAId, userBId] = [swiperId, targetUserId].sort();
        let matchId: string | undefined;
        try {
          const match = await this.prisma.match.create({ data: { userAId, userBId } });
          matchId = match.id;
        } catch {
          const match = await this.prisma.match.findUnique({ where: { userAId_userBId: { userAId, userBId } } });
          matchId = match?.id;
        }
        if (matchId) {
          this.chatGateway.emitMatchNew(swiperId, targetUserId, matchId);
        }
        return { matched: true, matchId };
      }
    }

    return { matched: false };
  }

  async sendTreat(senderId: string, targetUserId: string) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } });
      if (!senderWallet || senderWallet.balance < 1) throw new Error('INSUFFICIENT_BALANCE');

      await tx.wallet.update({ where: { userId: senderId }, data: { balance: { decrement: 1 } } });
      await tx.wallet.update({ where: { userId: targetUserId }, data: { balance: { increment: 1 } } });
      await tx.walletTransaction.createMany({
        data: [
          { userId: senderId, type: 'DEBIT', amount: 1, relatedEntityId: targetUserId },
          { userId: targetUserId, type: 'CREDIT', amount: 1, relatedEntityId: senderId },
        ],
      });
      return { ok: true };
    });
  }

  async getMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { select: { id: true, email: true, role: true, pets: { include: { photos: true } } } },
        userB: { select: { id: true, email: true, role: true, pets: { include: { photos: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      matches.map(async (m) => {
        const partner = m.userAId === userId ? m.userB : m.userA;
        const unreadKey = `unread:${m.id}:${userId}`;
        const unread = await this.redis.get(unreadKey);
        return {
          id: m.id,
          partner,
          lastMessage: m.messages[0] ?? null,
          unreadCount: parseInt(unread ?? '0'),
          createdAt: m.createdAt,
        };
      }),
    );
  }

  async getMatch(matchId: string) {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        userA: { select: { id: true, email: true, role: true } },
        userB: { select: { id: true, email: true, role: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }
}
