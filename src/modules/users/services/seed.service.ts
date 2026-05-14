import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';
import {ConfigService} from "@nestjs/config";

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService
  ) {}
    
  async runSeed() {
    // 1. Limpiar tabla (Opcional, cuidado en producción)
    // await this.userRepo.query('TRUNCATE TABLE users CASCADE');

    const mockUsers = [
      { user: 'admin@piedra-azul.com', password: this.configService.get('SEED_ADMIN_PASSWORD'), role: UserRole.ADMINISTRADOR },
      { user: 'agenda@piedra-azul.com', password: this.configService.get('SEED_AGENDADOR_PASSWORD'), role: UserRole.AGENDADOR },
      { user: 'medico@piedra-azul.com', password: this.configService.get('SEED_MEDICO_PASSWORD'), role: UserRole.MEDICO },
      { user: '1234567890', password: this.configService.get('SEED_PACIENTE_PASSWORD'), role: UserRole.PACIENTE },
      { user: '12345678', password: this.configService.get('SEED_PACIENTE2_PASSWORD'), role: UserRole.PACIENTE },
    ];

    for (const u of mockUsers) {
      const exists = await this.userRepo.findOne({ where: { user: u.user } });
      
      if (!exists) {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        const newUser = this.userRepo.create({
          user: u.user,
          password: hashedPassword,
          role: u.role,
          isActive: true,
        });
        await this.userRepo.save(newUser);
        console.log(`Usuario creado: ${u.user} (${u.role})`);
      }
    }

    return { message: 'Seed ejecutado con éxito' };
  }
}