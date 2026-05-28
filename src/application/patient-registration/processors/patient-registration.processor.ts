import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { User } from '../../../modules/users/entities/user.entity';
import { Patient } from '../../../modules/patients/entities/patient.entity';
import { RegisterPatientDto } from '../dto/register-patient.dto';
import { UserRole } from '../../../shared/enum/user-role.enum';

@Injectable()
export class PatientRegistrationProcessor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async getAdminToken(): Promise<string> {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const response = await firstValueFrom(
      this.httpService.post<any>(
        `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          client_id: 'admin-cli',
          username: 'admin',
          password: 'admin',
          grant_type: 'password',
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
    );
    return response.data.access_token;
  }

  private async createKeycloakUser(
    username: string,
    password: string,
    email: string | undefined,
    firstName: string,
    lastName: string,
  ): Promise<string> {
    const keycloakUrl = this.configService.get<string>('KEYCLOAK_URL');
    const realm = this.configService.get<string>('KEYCLOAK_REALM');
    const adminToken = await this.getAdminToken();

    // Crear usuario en Keycloak
    await firstValueFrom(
      this.httpService.post<any>(
        `${keycloakUrl}/admin/realms/${realm}/users`,
        {
          username,
          email: email || `${username}@piedrazul.com`,
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [{ type: 'password', value: password, temporary: false }],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
    );

    // Obtener el ID del usuario recién creado
    const usersResponse = await firstValueFrom(
      this.httpService.get<any[]>(
        `${keycloakUrl}/admin/realms/${realm}/users?username=${username}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
    );
    const keycloakUserId = usersResponse.data[0].id;

    // Obtener el ID del rol PACIENTE
    const rolesResponse = await firstValueFrom(
      this.httpService.get<any>(
        `${keycloakUrl}/admin/realms/${realm}/roles/PACIENTE`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
    );
    const role = rolesResponse.data;

    // Asignar el rol PACIENTE al usuario
    await firstValueFrom(
      this.httpService.post<any>(
        `${keycloakUrl}/admin/realms/${realm}/users/${keycloakUserId}/role-mappings/realm`,
        [role],
        { headers: { Authorization: `Bearer ${adminToken}` } }
      )
    );

    return keycloakUserId;
  }

  async processRegistration(dto: RegisterPatientDto, existingPatient: Patient | null) {
    // Crear usuario en Keycloak primero
    const keycloakId = await this.createKeycloakUser(
      dto.document,
      dto.password,
      dto.email,
      dto.firstName,
      dto.lastName,
    );

    return this.dataSource.transaction(async (manager) => {
      const userRepo    = manager.getRepository(User);
      const patientRepo = manager.getRepository(Patient);

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Crear usuario en BD local con el ID de Keycloak
      const user = userRepo.create({
        id: keycloakId,
        user: dto.document,
        password: hashedPassword,
        role: UserRole.PACIENTE,
        isActive: true,
      });

      await userRepo.save(user);

      if (existingPatient) {
        existingPatient.user = user;
        await patientRepo.save(existingPatient);
        return { message: 'Usuario vinculado a paciente', id: user.id, role: user.role };
      }

      const patient = patientRepo.create({
        document:  dto.document,
        firstName: dto.firstName,
        lastName:  dto.lastName,
        birthdate: dto.birthdate ? new Date(dto.birthdate) : undefined,
        gender:    dto.gender,
        phone:     dto.phone,
        email:     dto.email,
        isActive:  true,
        user,
      });

      await patientRepo.save(patient);

      return { message: 'Paciente con usuario creado con éxito', id: user.id, role: user.role };
    });
  }
}