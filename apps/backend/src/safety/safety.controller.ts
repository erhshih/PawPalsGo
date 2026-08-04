import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

@Controller()
@UseGuards(JwtAuthGuard)
export class SafetyController {
  constructor(private safetyService: SafetyService) {}

  @Post('blocks/:userId')
  block(@Param('userId') userId: string, @Req() req: { user: RequestUser }) {
    return this.safetyService.block(req.user.userId, userId);
  }

  @Delete('blocks/:userId')
  unblock(@Param('userId') userId: string, @Req() req: { user: RequestUser }) {
    return this.safetyService.unblock(req.user.userId, userId);
  }

  @Get('blocks')
  listBlocked(@Req() req: { user: RequestUser }) {
    return this.safetyService.listBlocked(req.user.userId);
  }

  @Post('reports')
  report(@Body() dto: CreateReportDto, @Req() req: { user: RequestUser }) {
    return this.safetyService.report(req.user.userId, dto);
  }

  @Get('reports/mine')
  listMyReports(@Req() req: { user: RequestUser }) {
    return this.safetyService.listMyReports(req.user.userId);
  }
}
