import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitiesModule } from '../availabilities/availabilities.module';
import { Patient } from './entities/patient.entity';
import { PatientsController } from './controllers/patients.controller';
import { PatientsService } from './services/patients.service';
import { User } from '../../modules/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, User ]),
    AvailabilitiesModule,
  ],
  controllers: [PatientsController,],
  providers: [PatientsService, ],
  exports: [PatientsService, ],
})
export class PatientsModule {}