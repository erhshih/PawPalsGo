import {
  Body, Controller, Get, Patch, Post, Query, Req, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import {
  IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, IsEnum,
  IsArray, ArrayMaxSize, Allow, IsInt, Min, Max,
} from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { Prisma } from '@prisma/client';
import { DiscoverService } from './discover.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import type { RequestUser } from '../auth/jwt.strategy';
import { extname } from 'path';

class UpdateLocationDto {
  @IsLatitude()
  lat: number;

  @IsLongitude()
  lng: number;
}

class UpdateProfileDto {
  @Allow() @IsOptional() @IsString() @MaxLength(30)
  displayName?: string;

  @Allow() @IsOptional() @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @Allow() @IsOptional() @IsString() @MaxLength(300)
  bio?: string;

  @Allow() @IsOptional() @IsArray() @ArrayMaxSize(10)
  interests?: string[];

  @Allow() @IsOptional() @IsString() @MaxLength(50)
  education?: string;

  @Allow() @IsOptional() @IsString() @MaxLength(20)
  zodiac?: string;

  @Allow() @IsOptional() @IsString() @MaxLength(50)
  jobTitle?: string;

  @Allow() @IsOptional() @IsString() @MaxLength(50)
  company?: string;

  @Allow() @IsOptional() @IsString() @MaxLength(50)
  school?: string;

  @Allow() @IsOptional() @IsString() @MaxLength(50)
  city?: string;

  @Allow() @IsOptional() @IsInt() @Min(100) @Max(250)
  height?: number;
}

const USER_SELECT = {
  id: true, email: true, role: true, gender: true, displayName: true,
  bio: true, interests: true, education: true, zodiac: true,
  jobTitle: true, company: true, school: true, city: true,
  height: true, avatarUrl: true, createdAt: true,
};

@Controller()
@UseGuards(JwtAuthGuard)
export class DiscoverController {
  constructor(
    private discoverService: DiscoverService,
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  @Get('users/me')
  async getMe(@Req() req: { user: RequestUser }) {
    return this.prisma.user.findUnique({ where: { id: req.user.userId }, select: USER_SELECT });
  }

  @Patch('users/me')
  async updateMe(@Req() req: { user: RequestUser }, @Body() dto: UpdateProfileDto) {
    const data: Prisma.UserUpdateInput = {};
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.interests !== undefined) data.interests = { set: dto.interests };
    if (dto.education !== undefined) data.education = dto.education;
    if (dto.zodiac !== undefined) data.zodiac = dto.zodiac;
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.company !== undefined) data.company = dto.company;
    if (dto.school !== undefined) data.school = dto.school;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.height !== undefined) data.height = dto.height;
    return this.prisma.user.update({
      where: { id: req.user.userId },
      data,
      select: USER_SELECT,
    });
  }

  @Post('users/me/avatar')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: RequestUser },
  ) {
    const key = `avatars/${req.user.userId}/${Date.now()}${extname(file.originalname)}`;
    const avatarUrl = await this.storageService.uploadBuffer(file.buffer, key, file.mimetype);
    await this.prisma.user.update({
      where: { id: req.user.userId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  @Get('users/me/stats')
  async getMyStats(@Req() req: { user: RequestUser }) {
    const userId = req.user.userId;
    const [matches, messages] = await Promise.all([
      this.prisma.match.count({ where: { OR: [{ userAId: userId }, { userBId: userId }] } }),
      this.prisma.message.count({ where: { senderId: userId } }),
    ]);
    return { matches, messages };
  }

  @Patch('users/me/location')
  updateLocation(@Body() dto: UpdateLocationDto, @Req() req: { user: RequestUser }) {
    return this.discoverService.updateLocation(req.user.userId, dto.lat, dto.lng);
  }

  @Get('discover')
  findNearby(
    @Req() req: { user: RequestUser },
    @Query('radius') radius = '5',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('gender') gender?: string,
    @Query('roleFilter') roleFilter?: string,
  ) {
    const ALLOWED_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER']);
    const genderFilter = gender
      ? gender.split(',').map((g) => g.trim()).filter((g) => ALLOWED_GENDERS.has(g))
      : [];

    const ALLOWED_ROLES = new Set(['OWNER', 'LOVER']);
    const safeRoleFilter = roleFilter && ALLOWED_ROLES.has(roleFilter) ? roleFilter : null;

    return this.discoverService.findNearby(
      req.user.userId,
      Math.min(parseInt(radius), 50),
      parseInt(page),
      parseInt(limit),
      genderFilter,
      safeRoleFilter,
    );
  }
}
