import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(REDIS_CLIENT) private redis: Redis,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: { email: dto.email, passwordHash, role: dto.role, gender: dto.gender },
      });
      await tx.wallet.create({ data: { userId: u.id, balance: 0 } });
      return u;
    });

    const tokens = await this.signTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { ...tokens, userId: user.id };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const tokens = await this.signTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { ...tokens, userId: user.id, role: user.role };
  }

  async refresh(userId: string, refreshToken: string) {
    const stored = await this.redis.get(`refresh:${userId}`);
    if (!stored) throw new UnauthorizedException('SESSION_EXPIRED');

    const valid = await bcrypt.compare(refreshToken, stored);
    if (!valid) throw new UnauthorizedException('INVALID_REFRESH_TOKEN');

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const tokens = await this.signTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
  }

  private async signTokens(userId: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, role },
        { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' },
      ),
      this.jwt.signAsync(
        { sub: userId, role },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.redis.set(`refresh:${userId}`, hash, 'EX', 604800);
  }
}
