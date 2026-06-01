import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { DiscoverModule } from './discover/discover.module';
import { SwipeModule } from './swipe/swipe.module';
import { WalletModule } from './wallet/wallet.module';
import { MeetingModule } from './meeting/meeting.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PetsModule,
    DiscoverModule,
    SwipeModule,
    WalletModule,
    MeetingModule,
    ChatModule,
  ],
})
export class AppModule {}
