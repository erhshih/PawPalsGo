import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';

@Module({
  imports: [JwtModule.register({})],
  providers: [ChatGateway],
  controllers: [ChatController],
  exports: [ChatGateway],
})
export class ChatModule {}
