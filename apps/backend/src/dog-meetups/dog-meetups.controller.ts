import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { DogMeetupsService } from './dog-meetups.service';
import { CreateMeetupDto } from './dto/create-meetup.dto';
import { JoinMeetupDto } from './dto/join-meetup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

@Controller('dog-meetups')
@UseGuards(JwtAuthGuard)
export class DogMeetupsController {
  constructor(private dogMeetupsService: DogMeetupsService) {}

  @Post()
  create(@Body() dto: CreateMeetupDto, @Req() req: { user: RequestUser }) {
    return this.dogMeetupsService.create(req.user.userId, dto);
  }

  @Get('nearby')
  getNearby(
    @Req() req: { user: RequestUser },
    @Query('radius') radius = '10',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.dogMeetupsService.getNearby(
      req.user.userId,
      Math.min(parseInt(radius), 50),
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':meetupId')
  getOne(@Param('meetupId') meetupId: string) {
    return this.dogMeetupsService.getOne(meetupId);
  }

  @Delete(':meetupId')
  cancel(@Param('meetupId') meetupId: string, @Req() req: { user: RequestUser }) {
    return this.dogMeetupsService.cancel(meetupId, req.user.userId);
  }

  @Post(':meetupId/join')
  join(@Param('meetupId') meetupId: string, @Body() dto: JoinMeetupDto, @Req() req: { user: RequestUser }) {
    return this.dogMeetupsService.join(meetupId, req.user.userId, dto.petId);
  }

  @Delete(':meetupId/leave')
  leave(@Param('meetupId') meetupId: string, @Req() req: { user: RequestUser }) {
    return this.dogMeetupsService.leave(meetupId, req.user.userId);
  }
}
