import { Module } from '@nestjs/common';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';
import { WalletModule } from '../wallet/wallet.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [WalletModule, ChatModule],
  controllers: [MeetingController],
  providers: [MeetingService],
})
export class MeetingModule {}
