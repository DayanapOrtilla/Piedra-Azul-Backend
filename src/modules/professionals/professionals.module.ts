import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalsController } from './controllers/professionals.controller';
import { ProfessionalsService } from './services/professionals.service';
import { Professional } from './entities/professional.entity';
import { AvailabilitiesModule } from '../availabilities/availabilities.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Professional ]),
    AvailabilitiesModule,
  ],
  controllers: [ProfessionalsController,],
  providers: [ProfessionalsService, ],
  exports: [ProfessionalsService, ],
})
export class ProfessionalsModule {}