import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { RegisterPatientDto } from './../dto/register-patient.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../shared/enum/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
  ) {}

  async registerPatient(dto: RegisterPatientDto) {
    // 1. Verificar si el user (documento) ya existe en la tabla de usuarios
    const userExists = await this.userRepo.findOne({ where: { user: dto.document } });
    if (userExists) throw new ConflictException('Este número de identificación ya tiene un usuario.');

    // 2. Verificar si el paciente fue pre-registrado por un agendador
    let patient = await this.patientRepo.findOne({ 
      where: { document: dto.document },
      relations: ['user'] 
    });

    if (patient && patient.user) {
      throw new BadRequestException('Este documento ya tiene un usuario vinculado.');
    }

    // 3. Crear el nuevo Usuario (Usa 'user' como campo de identificación)
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = this.userRepo.create({
      user: dto.document, // <--- Aquí usamos el documento como el "username"
      password: hashedPassword,
      role: UserRole.PACIENTE,
      isActive: true,
    });

    const savedUser = await this.userRepo.save(newUser);

    // 4. Lógica de Vinculación o Creación de Perfil
    if (patient) {
      patient.user = savedUser;
      patient.email = dto.email; 
      await this.patientRepo.save(patient);
    } else {
      const newPatient = this.patientRepo.create({
        ...dto, // Asumiendo que el DTO tiene firstName, lastName, etc.
        user: savedUser,
      });
      await this.patientRepo.save(newPatient);
    }

    return { 
      message: 'Registro exitoso',
      userId: savedUser.id,
      role: savedUser.role 
    };
  }

  // --- MÉTODOS ADMINISTRATIVOS (Para completar el controlador) ---

  async findAllFiltered(role?: UserRole) {
    return await this.userRepo.find({
      where: role ? { role, isActive: true } : { isActive: true },
      relations: ['patient', 'professional'],
      select: ['id', 'user', 'role', 'isActive'] 
    });
  }

  async updateStatus(id: string, isActive: boolean, requestUser: any) {
    const userToUpdate = await this.userRepo.findOne({ where: { id } });
    if (!userToUpdate) throw new NotFoundException('Usuario no encontrado');

    // El AGENDADOR solo puede tocar PACIENTES
    if (requestUser.role === UserRole.AGENDADOR && userToUpdate.role !== UserRole.PACIENTE) {
      throw new ForbiddenException('No tienes permiso para desactivar personal administrativo');
    }

    userToUpdate.isActive = isActive;
    return await this.userRepo.save(userToUpdate);
  }

  async changePassword(id: string, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update(id, { password: hashed });
    return { message: 'Contraseña actualizada correctamente' };
  }
}