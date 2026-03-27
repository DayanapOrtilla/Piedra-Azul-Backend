import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfessionalsController } from './controllers/professionals.controller';
import { ProfessionalsService } from './services/professionals.service';
import { Professional } from './entities/professional.entity';
import { AvailabilitiesModule } from '../availabilities/availabilities.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Professional ]),
    UsersModule,
    AvailabilitiesModule,
  ],
  controllers: [ProfessionalsController,],
  providers: [ProfessionalsService, ],
  exports: [ProfessionalsService, ],
})
export class ProfessionalsModule {}