import { Module } from '@nestjs/common';
import { DiscoverController } from './discover.controller';
import { DiscoverService } from './discover.service';
import { SafetyModule } from '../safety/safety.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SafetyModule, StorageModule],
  controllers: [DiscoverController],
  providers: [DiscoverService],
})
export class DiscoverModule {}
