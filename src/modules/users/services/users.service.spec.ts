import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from '../../../shared/enum/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: any;

  beforeEach(() => {
    userRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
    };

    service = new UsersService(userRepo);

    (bcrypt.hash as jest.Mock).mockResolvedValue('password-hasheado');
  });

  it('debe crear un usuario', async () => {
    const dto = {
      user: 'admin@piedra-azul.com',
      password: 'admin123',
      role: UserRole.ADMINISTRADOR,
      isActive: true,
    };

    userRepo.save.mockResolvedValue({
      id: 'user-1',
      ...dto,
    });

    const result = await service.create(dto as any);

    expect(userRepo.create).toHaveBeenCalledWith(dto);
    expect(userRepo.save).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('user-1');
  });

  it('debe listar usuarios activos filtrados por rol', async () => {
    userRepo.find.mockResolvedValue([
      {
        id: 'user-1',
        user: 'agenda@piedra-azul.com',
        role: UserRole.AGENDADOR,
        isActive: true,
      },
    ]);

    const result = await service.findAllFiltered(UserRole.AGENDADOR);

    expect(userRepo.find).toHaveBeenCalledWith({
      where: {
        role: UserRole.AGENDADOR,
        isActive: true,
      },
      relations: ['patient', 'professional'],
      select: ['id', 'user', 'role', 'isActive'],
    });

    expect(result).toHaveLength(1);
  });

  it('debe listar todos los usuarios activos cuando no se envía rol', async () => {
    userRepo.find.mockResolvedValue([
      {
        id: 'user-1',
        user: 'admin@piedra-azul.com',
        role: UserRole.ADMINISTRADOR,
        isActive: true,
      },
    ]);

    const result = await service.findAllFiltered();

    expect(userRepo.find).toHaveBeenCalledWith({
      where: {
        isActive: true,
      },
      relations: ['patient', 'professional'],
      select: ['id', 'user', 'role', 'isActive'],
    });

    expect(result).toHaveLength(1);
  });

  it('debe actualizar el estado de un usuario existente', async () => {
    const userToUpdate = {
      id: 'user-1',
      user: 'paciente@piedra-azul.com',
      role: UserRole.PACIENTE,
      isActive: true,
    };

    userRepo.findOne.mockResolvedValue(userToUpdate);
    userRepo.save.mockResolvedValue({
      ...userToUpdate,
      isActive: false,
    });

    const result = await service.updateStatus('user-1', false, {
      role: UserRole.ADMINISTRADOR,
    });

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });

    expect(userRepo.save).toHaveBeenCalledWith({
      ...userToUpdate,
      isActive: false,
    });

    expect(result.isActive).toBe(false);
  });

  it('debe lanzar NotFoundException si el usuario a actualizar no existe', async () => {
    userRepo.findOne.mockResolvedValue(null);

    await expect(
      service.updateStatus('user-no-existe', false, {
        role: UserRole.ADMINISTRADOR,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe impedir que un agendador desactive usuarios administrativos', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-admin',
      user: 'admin@piedra-azul.com',
      role: UserRole.ADMINISTRADOR,
      isActive: true,
    });

    await expect(
      service.updateStatus('user-admin', false, {
        role: UserRole.AGENDADOR,
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('debe cambiar la contraseña de un usuario', async () => {
    const result = await service.changePassword('user-1', 'NuevaPassword123');

    expect(bcrypt.hash).toHaveBeenCalledWith('NuevaPassword123', 10);

    expect(userRepo.update).toHaveBeenCalledWith('user-1', {
      password: 'password-hasheado',
    });

    expect(result).toEqual({
      message: 'Contraseña actualizada correctamente',
    });
  });

  it('debe buscar un usuario por nombre de usuario o correo', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      user: 'admin@piedra-azul.com',
    });

    const result = await service.findByUserName('admin@piedra-azul.com');

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { user: 'admin@piedra-azul.com' },
    });

    expect(result.user).toBe('admin@piedra-azul.com');
  });
});