jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    userRepo = { findOne: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token-falso') };
    service = new AuthService(userRepo as any, jwtService as JwtService);
    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('debe retornar usuario y token cuando las credenciales son válidas', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      user: 'admin@piedra-azul.com',
      password: 'hash',
      role: UserRole.ADMINISTRADOR,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      user: 'admin@piedra-azul.com',
      password: 'admin123',
    });

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { user: 'admin@piedra-azul.com', isActive: true },
      select: ['id', 'user', 'password', 'role'],
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u1',
      user: 'admin@piedra-azul.com',
      role: UserRole.ADMINISTRADOR,
    });
    expect(result).toEqual({
      user: {
        id: 'u1',
        user: 'admin@piedra-azul.com',
        role: UserRole.ADMINISTRADOR,
      },
      token: 'token-falso',
    });
  });

  it('debe lanzar UnauthorizedException cuando el usuario no existe', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.login({ user: 'noexiste@correo.com', password: '12345678' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('debe lanzar UnauthorizedException cuando la contraseña es inválida', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      user: 'admin@piedra-azul.com',
      password: 'hash',
      role: UserRole.ADMINISTRADOR,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ user: 'admin@piedra-azul.com', password: 'incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
