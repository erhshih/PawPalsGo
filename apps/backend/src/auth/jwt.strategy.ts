import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  role: 'OWNER' | 'LOVER';
}

export interface RequestUser {
  userId: string;
  role: 'OWNER' | 'LOVER';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') as string,
    });
  }

  validate(payload: JwtPayload): RequestUser {
    return { userId: payload.sub, role: payload.role };
  }
}
