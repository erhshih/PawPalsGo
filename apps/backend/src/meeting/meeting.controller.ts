import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { CreateMeetingDto, MeetingService } from './meeting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

class VerifyDto {
  @IsString()
  token: string;
}

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private meetingService: MeetingService) {}

  @Post()
  create(@Body() dto: CreateMeetingDto, @Req() req: { user: RequestUser }) {
    return this.meetingService.create(req.user.userId, dto);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.meetingService.cancel(id, req.user.userId);
  }

  @Get(':id/qr')
  getQr(@Param('id') id: string, @Req() req: { user: RequestUser }) {
    return this.meetingService.getQr(id, req.user.userId);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyDto, @Req() req: { user: RequestUser }) {
    return this.meetingService.verify(id, req.user.userId, dto.token);
  }
}
