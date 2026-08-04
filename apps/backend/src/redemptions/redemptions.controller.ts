import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RedemptionsService } from './redemptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

@Controller('redemptions')
@UseGuards(JwtAuthGuard)
export class RedemptionsController {
  constructor(private redemptionsService: RedemptionsService) {}

  @Get('rewards')
  listRewards() {
    return this.redemptionsService.listRewards();
  }

  @Post('rewards/:rewardId')
  redeem(@Param('rewardId') rewardId: string, @Req() req: { user: RequestUser }) {
    return this.redemptionsService.redeem(req.user.userId, rewardId);
  }

  @Get('history')
  getMyRedemptions(@Req() req: { user: RequestUser }) {
    return this.redemptionsService.getMyRedemptions(req.user.userId);
  }
}
