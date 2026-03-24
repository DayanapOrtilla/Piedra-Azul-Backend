import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Professional } from './modules/professionals/entities/professional.entity';
import { Patient } from './modules/patients/entities/patient.entity';
import { Appointment } from './modules/appointments/entities/appointment.entity';
import { Availability } from './modules/availabilities/entities/availability.entity';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { AvailabilitiesModule } from './modules/availabilities/availabilities.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Professional, Patient, Appointment, Availability],
        synchronize: true,
      }),
    }),
    ProfessionalsModule,
    AvailabilitiesModule,
    PatientsModule,
    AppointmentsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
