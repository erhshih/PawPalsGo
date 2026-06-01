import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsEnum, IsUUID } from 'class-validator';
import { SwipeService } from './swipe.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

class SwipeDto {
  @IsUUID()
  targetUserId: string;

  @IsEnum(['LIKE', 'PASS', 'SUPER_LIKE'])
  direction: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class SwipeController {
  constructor(private swipeService: SwipeService) {}

  @Post('swipes')
  swipe(@Body() dto: SwipeDto, @Req() req: { user: RequestUser }) {
    return this.swipeService.swipe(req.user.userId, dto.targetUserId, dto.direction);
  }

  @Post('swipes/:targetUserId/treat')
  sendTreat(@Param('targetUserId') targetUserId: string, @Req() req: { user: RequestUser }) {
    return this.swipeService.sendTreat(req.user.userId, targetUserId);
  }

  @Get('matches')
  getMatches(@Req() req: { user: RequestUser }) {
    return this.swipeService.getMatches(req.user.userId);
  }

  @Get('matches/:matchId')
  async getMatch(@Param('matchId') matchId: string, @Req() req: { user: RequestUser }) {
    const match = await this.swipeService.getMatch(matchId);
    if (!match || (match.userA.id !== req.user.userId && match.userB.id !== req.user.userId)) {
      throw new ForbiddenException();
    }
    const partner = match.userA.id === req.user.userId ? match.userB : match.userA;
    return { ...match, partner };
  }
}
