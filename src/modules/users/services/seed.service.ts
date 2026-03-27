import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../../../shared/enum/user-role.enum';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async runSeed() {
    // 1. Limpiar tabla (Opcional, cuidado en producción)
    // await this.userRepo.query('TRUNCATE TABLE users CASCADE');

    const mockUsers = [
      { user: 'admin@piedra-azul.com', password: 'admin123', role: UserRole.ADMINISTRADOR },
      { user: 'agenda@piedra-azul.com', password: 'agenda123', role: UserRole.AGENDADOR },
      { user: 'medico@piedra-azul.com', password: 'medico123', role: UserRole.MEDICO },
      { user: '1234567890', password: 'paciente123', role: UserRole.PACIENTE },
      { user: '12345678', password: '12345678', role: UserRole.PACIENTE },
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