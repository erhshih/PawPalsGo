import { Module } from '@nestjs/common';
import { DogMeetupsController } from './dog-meetups.controller';
import { DogMeetupsService } from './dog-meetups.service';

@Module({
  controllers: [DogMeetupsController],
  providers: [DogMeetupsService],
})
export class DogMeetupsModule {}
