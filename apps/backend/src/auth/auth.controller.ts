import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { RequestUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.register(dto);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { accessToken: tokens.accessToken, userId: tokens.userId };
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.login(dto);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { accessToken: tokens.accessToken, userId: tokens.userId, role: tokens.role };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken as string;
    const payload = this.parseRefreshToken(refreshToken);
    const tokens = await this.authService.refresh(payload.userId, refreshToken);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async logout(@Req() req: Request & { user: RequestUser }, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.userId);
    res.clearCookie('refreshToken');
    return { ok: true };
  }

  private parseRefreshToken(token: string): { userId: string } {
    const parts = token?.split('.');
    if (!parts || parts.length !== 3) throw new UnauthorizedException('Invalid token');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString()) as { sub: string };
    return { userId: payload.sub };
  }
}
