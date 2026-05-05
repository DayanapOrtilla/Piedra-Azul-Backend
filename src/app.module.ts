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
import { User } from './modules/users/entities/user.entity';
import { UsersModule } from './modules/users/users.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { PatientRegistrationModule } from './application/patient-registration/patient-registration.module';
import { 
  KeycloakConnectModule, 
  ResourceGuard, 
  RoleGuard, 
  AuthGuard,
  PolicyEnforcementMode,
  TokenValidation 
} from 'nest-keycloak-connect';
import { config } from 'process';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env',
    }),
    KeycloakConnectModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        authServerUrl: config.get<string>('KEYCLOAK_AUTH_SERVER_URL') || '',
        realm: config.get<string>('KEYCLOAK_REALM') || '',
        clientId: config.get<string>('KEYCLOAK_CLIENT_ID') || '',
        secret: config.get<string>('KEYCLOAK_SECRET') || '',
        policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
        tokenValidation: TokenValidation.ONLINE,
      }),
    })    ,
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
        entities: [Professional, Patient, Appointment, Availability, User],
        synchronize: true,
      }),
    }),
    ProfessionalsModule,
    AvailabilitiesModule,
    PatientsModule,
    AppointmentsModule,
    UsersModule,
    AuthModule,
    PatientRegistrationModule
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}
