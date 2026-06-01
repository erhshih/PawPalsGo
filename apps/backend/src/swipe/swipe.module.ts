import { Module } from '@nestjs/common';
import { SwipeController } from './swipe.controller';
import { SwipeService } from './swipe.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule],
  controllers: [SwipeController],
  providers: [SwipeService],
  exports: [SwipeService],
})
export class SwipeModule {}
