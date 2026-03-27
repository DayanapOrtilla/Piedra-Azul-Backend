import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entities/user.entity';
import { LoginDto } from '../dto/auth.login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por email (incluyendo el password que está oculto por defecto)
    const user = await this.userRepo.findOne({
      where: { user: loginDto.user, isActive: true },
      select: ['id', 'user', 'password', 'role'], 
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Credenciales inválidas');

    // 3. Generar el Payload (lo que viajará dentro del token)
    const payload = { 
      sub: user.id, 
      user: user.user, 
      role: user.role 
    };

    return {
      user: {
        id: user.id,
        user: user.user,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
    };
  }
}