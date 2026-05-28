// /application/patient-registration/patient-registration.service.ts
import { PatientsService } from '../../../modules/patients/services/patients.service';
import { UsersService } from '../../../modules/users/services/users.service';
import { Injectable, BadRequestException } from '@nestjs/common';
import { RegisterPatientDto } from '../dto/register-patient.dto';
import { PatientRegistrationProcessor } from '../processors/patient-registration.processor';

@Injectable()
export class PatientRegistrationService {
  constructor(
    private readonly userService: UsersService,
    private readonly patientService: PatientsService,
    private readonly processor: PatientRegistrationProcessor,
  ) {}

  async register(dto: RegisterPatientDto) {
    const existingUser = await this.userService.findByUserName(dto.document);

    if (existingUser) {
      throw new BadRequestException('El usuario ya está registrado');
    }

    const patient = await this.patientService.findByDocument(dto.document);

    return this.processor.processRegistration(dto, patient);
  }
}