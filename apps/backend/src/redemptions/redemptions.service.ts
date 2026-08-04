import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RedemptionsService {
  constructor(private prisma: PrismaService) {}

  listRewards() {
    return this.prisma.redemptionReward.findMany({
      where: { active: true },
      orderBy: { costJerky: 'asc' },
    });
  }

  /**
   * 封閉迴圈兌換：肉乾扣款後換一組兌換碼，使用者拿兌換碼去合作品牌端領取實體商品。
   * 沒有任何路徑可以把肉乾換回現金——這是刻意的設計，見討論紀錄。
   */
  async redeem(userId: string, rewardId: string) {
    const reward = await this.prisma.redemptionReward.findUnique({ where: { id: rewardId } });
    if (!reward || !reward.active) throw new NotFoundException('REWARD_NOT_FOUND');
    if (reward.stock !== null && reward.stock <= 0) throw new UnprocessableEntityException('OUT_OF_STOCK');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < reward.costJerky) {
        throw new UnprocessableEntityException('INSUFFICIENT_BALANCE');
      }

      if (reward.stock !== null) {
        const updated = await tx.redemptionReward.updateMany({
          where: { id: rewardId, stock: { gt: 0 } },
          data: { stock: { decrement: 1 } },
        });
        if (updated.count === 0) throw new UnprocessableEntityException('OUT_OF_STOCK');
      }

      await tx.wallet.update({ where: { userId }, data: { balance: { decrement: reward.costJerky } } });
      await tx.walletTransaction.create({
        data: { userId, type: 'REDEMPTION', amount: reward.costJerky, relatedEntityId: rewardId },
      });

      const code = `PP-${uuidv4().split('-')[0].toUpperCase()}`;
      return tx.redemption.create({
        data: { rewardId, userId, code },
        include: { reward: true },
      });
    });
  }

  getMyRedemptions(userId: string) {
    return this.prisma.redemption.findMany({
      where: { userId },
      orderBy: { redeemedAt: 'desc' },
      include: { reward: true },
    });
  }
}
