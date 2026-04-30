jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;
  let patientRepo: any;

  beforeEach(() => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(),
      update: jest.fn(),
      find: jest.fn(),
    };

    patientRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      save: jest.fn(),
    };

    service = new UsersService(userRepo, patientRepo);
    (bcrypt.hash as jest.Mock).mockReset();
  });

  it('debe registrar un paciente nuevo cuando no existe usuario ni paciente previo', async () => {
    userRepo.findOne.mockResolvedValue(null);
    patientRepo.findOne.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hash123');
    userRepo.save.mockResolvedValue({ id: 'u1', role: UserRole.PACIENTE });
    patientRepo.save.mockResolvedValue({ id: 'p1' });

    const dto = {
      firstName: 'Ana',
      lastName: 'Pérez',
      document: '1234567890',
      type: 'FEMENINO' as any,
      phone: '3001234567',
      email: 'ana@mail.com',
      password: 'segura123',
    };

    const result = await service.registerPatient(dto as any);

    expect(userRepo.create).toHaveBeenCalledWith({
      user: '1234567890',
      password: 'hash123',
      role: UserRole.PACIENTE,
      isActive: true,
    });
    expect(patientRepo.create).toHaveBeenCalled();
    expect(result).toEqual({
      message: 'Registro exitoso',
      userId: 'u1',
      role: UserRole.PACIENTE,
    });
  });

  it('debe lanzar ConflictException si el documento ya existe como usuario', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1' });

    await expect(
      service.registerPatient({ document: '123', password: '12345678' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('debe lanzar BadRequestException si el paciente ya tiene usuario vinculado', async () => {
    userRepo.findOne.mockResolvedValue(null);
    patientRepo.findOne.mockResolvedValue({ id: 'p1', user: { id: 'u2' } });

    await expect(
      service.registerPatient({ document: '123', password: '12345678' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe impedir que un agendador desactive un usuario no paciente', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'u1', role: UserRole.ADMINISTRADOR });

    await expect(
      service.updateStatus('u1', false, { role: UserRole.AGENDADOR }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('debe lanzar NotFoundException si el usuario a actualizar no existe', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatus('u1', false, { role: UserRole.ADMINISTRADOR }),
    ).rejects.toThrow(NotFoundException);
  });
});
