import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

const BLOCKED_USER_SELECT = { id: true, displayName: true, avatarUrl: true };

@Injectable()
export class SafetyService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) throw new BadRequestException('CANNOT_BLOCK_SELF');
    await this.prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      create: { blockerId, blockedId },
      update: {},
    });
    return { ok: true };
  }

  async unblock(blockerId: string, blockedId: string) {
    await this.prisma.block.deleteMany({ where: { blockerId, blockedId } });
    return { ok: true };
  }

  async listBlocked(blockerId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId },
      include: { blocked: { select: BLOCKED_USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return blocks.map((b) => ({ blockedAt: b.createdAt, user: b.blocked }));
  }

  async report(reporterId: string, dto: CreateReportDto) {
    if (reporterId === dto.targetId) throw new BadRequestException('CANNOT_REPORT_SELF');
    if (dto.postId) {
      const post = await this.prisma.post.findUnique({ where: { id: dto.postId } });
      if (!post) throw new BadRequestException('POST_NOT_FOUND');
    }
    return this.prisma.report.create({
      data: {
        reporterId,
        targetId: dto.targetId,
        reason: dto.reason,
        detail: dto.detail,
        postId: dto.postId,
      },
    });
  }

  listMyReports(reporterId: string) {
    return this.prisma.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** 用來過濾 discover/feed/nearby 這種「候選人清單」的排除名單，雙向都算。 */
  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const b of blocks) {
      ids.add(b.blockerId === userId ? b.blockedId : b.blockerId);
    }
    return Array.from(ids);
  }

  /** 用來擋掉「已經有一方封鎖對方」的互動（滑卡片、傳訊息），雙向都算。 */
  async assertNotBlocked(userIdA: string, userIdB: string): Promise<void> {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userIdA, blockedId: userIdB },
          { blockerId: userIdB, blockedId: userIdA },
        ],
      },
    });
    if (block) throw new ForbiddenException('USER_BLOCKED');
  }
}
