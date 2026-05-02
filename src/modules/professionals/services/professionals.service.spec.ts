import { NotFoundException } from '@nestjs/common';
import { ProfessionalsService } from './professionals.service';
import { ProfessionalType } from '../../../shared/enum/professional-type.enum';
import { ProfessionalSpeciality } from '../../../shared/enum/professional-speciality.enum';
import { UserRole } from '../../../shared/enum/user-role.enum';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('ProfessionalsService', () => {
  let service: ProfessionalsService;
  let professionalRepo: any;
  let userRepo: any;
  let availabilityService: any;

  beforeEach(() => {
    professionalRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data) => data),
      remove: jest.fn(),
    };

    availabilityService = {
      createDefaultSchedule: jest.fn(),
    };

    service = new ProfessionalsService(
      professionalRepo,
      userRepo,
      availabilityService,
    );

    (bcrypt.hash as jest.Mock).mockResolvedValue('password-hasheado');
  });

  it('debe crear un profesional médico con usuario asociado y horarios base', async () => {
    const dto = {
      firstName: 'Carlos',
      lastName: 'Rodriguez',
      email: 'carlos@piedraazul.com',
      password: 'Password123',
      type: ProfessionalType.MEDICO,
      specialty: ProfessionalSpeciality.QUIROPRAXIA,
      intervalMinutes: 30,
      isActive: true,
    };

    const professionalSaved = {
      id: 'pro-1',
      ...dto,
      user: {
        user: dto.email,
        password: 'password-hasheado',
        role: UserRole.MEDICO,
      },
    };

    const professionalFull = {
      ...professionalSaved,
      availabilities: [],
    };

    userRepo.findOne.mockResolvedValue(null);
    professionalRepo.save.mockResolvedValue(professionalSaved);
    professionalRepo.findOne.mockResolvedValue(professionalFull);

    const result = await service.create(dto as any);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { user: dto.email },
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);

    expect(userRepo.create).toHaveBeenCalledWith({
      user: dto.email,
      password: 'password-hasheado',
      role: UserRole.MEDICO,
    });

    expect(professionalRepo.create).toHaveBeenCalled();
    expect(professionalRepo.save).toHaveBeenCalled();
    expect(availabilityService.createDefaultSchedule).toHaveBeenCalledWith(
      professionalSaved,
    );

    expect(result).toEqual(professionalFull);
  });

  it('debe listar profesionales filtrados por especialidad y estado activo', async () => {
    professionalRepo.find.mockResolvedValue([
      {
        id: 'pro-1',
        firstName: 'Carlos',
        specialty: ProfessionalSpeciality.QUIROPRAXIA,
        isActive: true,
      },
    ]);

    const result = await service.findAll(ProfessionalSpeciality.QUIROPRAXIA, true);

    expect(professionalRepo.find).toHaveBeenCalledWith({
      where: {
        specialty: ProfessionalSpeciality.QUIROPRAXIA,
        isActive: true,
      },
      relations: ['availabilities'],
      order: {
        firstName: 'ASC',
      },
    });

    expect(result).toHaveLength(1);
  });

  it('debe buscar un profesional por id con sus disponibilidades', async () => {
    const professional = {
      id: 'pro-1',
      firstName: 'Ana',
      availabilities: [],
    };

    professionalRepo.findOne.mockResolvedValue(professional);

    const result = await service.findOne('pro-1');

    expect(professionalRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'pro-1' },
      relations: ['availabilities'],
    });

    expect(result).toEqual(professional);
  });

  it('debe actualizar un profesional existente', async () => {
    const professionalUpdated = {
      id: 'pro-1',
      firstName: 'Nuevo nombre',
    };

    professionalRepo.preload.mockResolvedValue(professionalUpdated);
    professionalRepo.save.mockResolvedValue(professionalUpdated);

    const result = await service.update('pro-1', {
      firstName: 'Nuevo nombre',
    } as any);

    expect(professionalRepo.preload).toHaveBeenCalledWith({
      id: 'pro-1',
      firstName: 'Nuevo nombre',
    });

    expect(professionalRepo.save).toHaveBeenCalledWith(professionalUpdated);
    expect(result).toEqual(professionalUpdated);
  });

  it('debe lanzar NotFoundException al actualizar un profesional inexistente', async () => {
    professionalRepo.preload.mockResolvedValue(null);

    await expect(
      service.update('pro-no-existe', { firstName: 'Nombre' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe eliminar un profesional existente y su usuario asociado', async () => {
    const user = {
      id: 'user-1',
      user: 'profesional@piedraazul.com',
    };

    const professional = {
      id: 'pro-1',
      firstName: 'Carlos',
      user,
      availabilities: [],
    };

    professionalRepo.findOne.mockResolvedValue(professional);
    professionalRepo.remove.mockResolvedValue(professional);
    userRepo.remove.mockResolvedValue(user);

    const result = await service.remove('pro-1');

    expect(professionalRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'pro-1' },
      relations: ['availabilities', 'user'],
    });

    expect(professionalRepo.remove).toHaveBeenCalledWith(professional);
    expect(userRepo.remove).toHaveBeenCalledWith(user);
    expect(result).toEqual(user);
  });

  it('debe lanzar NotFoundException al eliminar un profesional inexistente', async () => {
    professionalRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('pro-no-existe')).rejects.toThrow(
      NotFoundException,
    );
  });
});