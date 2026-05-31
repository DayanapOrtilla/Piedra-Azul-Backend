jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { findOne: jest.Mock };
  let patientRepo: { findOne: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    userRepo = { findOne: jest.fn() };
    patientRepo = { findOne: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('token-falso') };

    service = new AuthService(
      userRepo as any,
      patientRepo as any,
      jwtService as any,
    );

    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('debe retornar usuario y token cuando las credenciales son válidas', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      user: 'admin@piedra-azul.com',
      password: 'hash',
      role: UserRole.ADMINISTRADOR,
      isActive: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      user: 'admin@piedra-azul.com',
      password: 'admin123',
    });

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { user: 'admin@piedra-azul.com', isActive: true },
      select: ['id', 'user', 'password', 'role', 'isActive'],
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u1',
      user: 'admin@piedra-azul.com',
      role: UserRole.ADMINISTRADOR,
    });

    expect(result.token).toBe('token-falso');
    expect(result.access_token).toBe('token-falso');
    expect(result.user).toEqual({
      id: 'u1',
      user: 'admin@piedra-azul.com',
      document: undefined,
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      phone: undefined,
      role: UserRole.ADMINISTRADOR,
      isActive: true,
    });
  });

  it('debe retornar datos del perfil cuando el usuario es paciente', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u2',
      user: '1234567890',
      password: 'hash',
      role: UserRole.PACIENTE,
      isActive: true,
    });

    patientRepo.findOne.mockResolvedValue({
      document: '1234567890',
      firstName: 'Dayana',
      lastName: 'Fuelpaz',
      email: 'dayana@piedra-azul.com',
      phone: '3189999185',
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      user: '1234567890',
      password: 'paciente123',
    });

    expect(patientRepo.findOne).toHaveBeenCalledWith({
      where: { document: '1234567890' },
    });

    expect(result.user).toEqual({
      id: 'u2',
      user: '1234567890',
      document: '1234567890',
      firstName: 'Dayana',
      lastName: 'Fuelpaz',
      email: 'dayana@piedra-azul.com',
      phone: '3189999185',
      role: UserRole.PACIENTE,
      isActive: true,
    });

    expect(result.token).toBe('token-falso');
    expect(result.access_token).toBe('token-falso');
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
      isActive: true,
    });

    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({ user: 'admin@piedra-azul.com', password: 'incorrecta' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
