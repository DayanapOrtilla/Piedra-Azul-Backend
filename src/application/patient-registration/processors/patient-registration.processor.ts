import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../../modules/users/entities/user.entity';
import { Patient } from '../../../modules/patients/entities/patient.entity';
import { RegisterPatientDto } from '../dto/register-patient.dto';
import { UserRole } from '../../../shared/enum/user-role.enum';

@Injectable()
export class PatientRegistrationProcessor {
  constructor(private readonly dataSource: DataSource) {}

  async processRegistration(dto: RegisterPatientDto, existingPatient: Patient | null,) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const patientRepo = manager.getRepository(Patient);

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const user = userRepo.create({
        user: dto.document,
        password: hashedPassword,
        role: UserRole.PACIENTE,
        isActive: true,
      });

      await userRepo.save(user);

      // 2. Cases
      if (existingPatient) {
        // Caso: existing patient → vinculate
        existingPatient.user = user;
        await patientRepo.save(existingPatient);

        return {
          message: 'Usuario vinculado a paciente',
          id: user.id,
          role: user.role
        };
      }

      // Caso: paciente no existe → crear
      const patient = patientRepo.create({
        document: dto.document,
        firstName: dto.firstName,
        lastName: dto.lastName,
        birthdate: dto.birthdate
          ? new Date(dto.birthdate)
          : undefined,
        gender: dto.gender,
        phone: dto.phone,
        email: dto.email,
        isActive: true,
        user,
      });

      await patientRepo.save(patient);

      return {
        message: 'Paciente con usuario creado con éxito',
        id: user.id,
        role: user.role,
      };
    });
  }
}