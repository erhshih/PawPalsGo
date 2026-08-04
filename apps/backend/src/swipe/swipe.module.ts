import { Module } from '@nestjs/common';
import { SwipeController } from './swipe.controller';
import { SwipeService } from './swipe.service';
import { ChatModule } from '../chat/chat.module';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [ChatModule, SafetyModule],
  controllers: [SwipeController],
  providers: [SwipeService],
  exports: [SwipeService],
})
export class SwipeModule {}
