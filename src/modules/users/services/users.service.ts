import { Injectable, BadRequestException, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../../../shared/enum/user-role.enum';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto) {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
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

  async findByUserName(user: string) {
    return this.userRepo.findOne({ where: { user } });
  }

}