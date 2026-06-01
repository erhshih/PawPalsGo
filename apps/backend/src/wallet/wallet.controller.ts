import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

class TopupDto {
  @IsString()
  packageId: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  getWallet(@Req() req: { user: RequestUser }) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Post('topup')
  topup(@Body() dto: TopupDto, @Req() req: { user: RequestUser }) {
    return this.walletService.topup(req.user.userId, dto.packageId);
  }
}
