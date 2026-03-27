import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitiesModule } from '../availabilities/availabilities.module';
import { AppointmentsController } from './controllers/appointment.controller';
import { AppointmentService } from './services/appointment.service';
import { Appointment } from './entities/appointment.entity';
import { ProfessionalsModule } from '../professionals/professionals.module';
import { PatientsModule } from '../patients/patients.module';
import { Availability } from '../availabilities/entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Availability ]),
    AvailabilitiesModule,
    PatientsModule,
    ProfessionalsModule,
  ],
  controllers: [AppointmentsController,],
  providers: [AppointmentService, ],
  exports: [AppointmentService, ],
})
export class AppointmentsModule {}