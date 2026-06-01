import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WALLET_PACKAGES } from '@pawpals/shared';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('WALLET_NOT_FOUND');
    return { balance: wallet.balance, currency: '肉乾' };
  }

  async topup(userId: string, packageId: string) {
    const pkg = WALLET_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new UnprocessableEntityException('INVALID_PACKAGE');

    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: pkg.jerky } },
      });
      await tx.walletTransaction.create({
        data: { userId, type: 'TOPUP', amount: pkg.jerky, relatedEntityId: packageId },
      });
      return { balance: wallet.balance, currency: '肉乾' };
    });
  }

  async debitEscrow(userId: string, amount: number, meetingId: string) {
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet || wallet.balance < amount) throw new UnprocessableEntityException('INSUFFICIENT_BALANCE');
      await tx.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
      await tx.walletTransaction.create({
        data: { userId, type: 'ESCROW', amount, relatedEntityId: meetingId },
      });
    });
  }

  async releaseEscrow(meetingId: string, recipientId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { userId: recipientId }, data: { balance: { increment: amount } } });
      await tx.walletTransaction.create({
        data: { userId: recipientId, type: 'ESCROW_RELEASE', amount, relatedEntityId: meetingId },
      });
    });
  }

  async refundEscrow(meetingId: string, userId: string, amount: number) {
    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({ where: { userId }, data: { balance: { increment: amount } } });
      await tx.walletTransaction.create({
        data: { userId, type: 'CREDIT', amount, relatedEntityId: meetingId },
      });
    });
  }
}
