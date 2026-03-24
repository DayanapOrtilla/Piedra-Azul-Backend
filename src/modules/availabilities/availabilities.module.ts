import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './controllers/availabilities.controller';
import { AvailabilityService } from './services/availability.service';
import { Availability } from './entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Availability]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], 
})
export class AvailabilitiesModule {}