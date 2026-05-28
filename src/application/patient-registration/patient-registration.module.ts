import { PatientsModule } from '../../modules/patients/patients.module';
import { UsersModule } from '../../modules/users/users.module';
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PatientRegistrationService } from './services/patient-registration.service';
import { PatientRegistrationProcessor } from './processors/patient-registration.processor';
import { UsersService } from '../../modules/users/services/users.service';

@Module({
  imports: [UsersModule, PatientsModule, HttpModule, ConfigModule],
  providers: [UsersService, PatientRegistrationService, PatientRegistrationProcessor],
  exports: [PatientRegistrationService],
})
export class PatientRegistrationModule {}