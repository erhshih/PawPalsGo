import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { PetsModule } from './pets/pets.module';
import { DiscoverModule } from './discover/discover.module';
import { SwipeModule } from './swipe/swipe.module';
import { WalletModule } from './wallet/wallet.module';
import { MeetingModule } from './meeting/meeting.module';
import { ChatModule } from './chat/chat.module';
import { PostsModule } from './posts/posts.module';
import { DogMeetupsModule } from './dog-meetups/dog-meetups.module';
import { RedemptionsModule } from './redemptions/redemptions.module';
import { SafetyModule } from './safety/safety.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    PetsModule,
    DiscoverModule,
    SwipeModule,
    WalletModule,
    MeetingModule,
    ChatModule,
    PostsModule,
    DogMeetupsModule,
    RedemptionsModule,
    SafetyModule,
  ],
})
export class AppModule {}
