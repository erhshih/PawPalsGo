import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { SafetyModule } from '../safety/safety.module';

@Module({
  imports: [JwtModule.register({}), SafetyModule],
  providers: [ChatGateway],
  controllers: [ChatController],
  exports: [ChatGateway],
})
export class ChatModule {}
