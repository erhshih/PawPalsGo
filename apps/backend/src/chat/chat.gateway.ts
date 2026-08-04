import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

@WebSocketGateway({ cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://localhost:3002'], credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = this.jwt.verify<{ sub: string; role: string }>(token, {
        secret: process.env.JWT_SECRET,
      });
      client.data.user = { userId: payload.sub, role: payload.role };
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('chat:join')
  async handleJoin(@MessageBody() data: { matchId: string }, @ConnectedSocket() client: Socket) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    const match = await this.prisma.match.findUnique({ where: { id: data.matchId } });
    if (!match || (match.userAId !== userId && match.userBId !== userId)) return;

    client.join(`room:match-${data.matchId}`);
  }

  @SubscribeMessage('chat:send')
  async handleMessage(
    @MessageBody() data: { matchId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.data.user?.userId;
    if (!userId) return;

    const match = await this.prisma.match.findUnique({ where: { id: data.matchId } });
    if (!match) return;

    const recipientId = match.userAId === userId ? match.userBId : match.userAId;
    const blocked = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: recipientId },
          { blockerId: recipientId, blockedId: userId },
        ],
      },
    });
    if (blocked) return;

    const message = await this.prisma.message.create({
      data: { matchId: data.matchId, senderId: userId, text: data.text },
    });
    await this.redis.incr(`unread:${data.matchId}:${recipientId}`);

    this.server.to(`room:match-${data.matchId}`).emit('chat:message', message);
  }

  emitMatchNew(userAId: string, userBId: string, matchId: string) {
    this.server.emit(`match:new:${userAId}`, { matchId });
    this.server.emit(`match:new:${userBId}`, { matchId });
  }

  emitMeetingUpdated(matchId: string, meeting: object) {
    this.server.to(`room:match-${matchId}`).emit('meeting:updated', meeting);
  }
}
