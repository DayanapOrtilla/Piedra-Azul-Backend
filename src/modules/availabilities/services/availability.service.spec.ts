import { BadRequestException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { Availability } from '../entities/availability.entity';

describe('AvailabilityService - nuevos requisitos', () => {
  let service: AvailabilityService;
  let availabilityRepo: any;
  let dataSource: any;
  let queryRunner: any;

  beforeEach(() => {
    availabilityRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn((data) => data),
    };

    queryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        delete: jest.fn(),
        save: jest.fn(async (data) => data),
      },
    };

    dataSource = {
      createQueryRunner: jest.fn(() => queryRunner),
    };

    service = new AvailabilityService(availabilityRepo, dataSource);
  });

  it('debe rechazar una disponibilidad activa cuando la hora final es menor o igual a la hora inicial', async () => {
    const disponibilidadInvalida = [
      {
        dayOfWeek: 1,
        startTime: '14:00:00',
        endTime: '10:00:00',
        isActive: true,
      },
    ];

    await expect(
      service.update('professional-1', disponibilidadInvalida as any),
    ).rejects.toThrow(BadRequestException);

    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });

  it('debe actualizar la configuración semanal del profesional usando una transacción', async () => {
    const nuevaDisponibilidad = [
      {
        dayOfWeek: 1,
        startTime: '08:00:00',
        endTime: '12:00:00',
        isActive: true,
      },
      {
        dayOfWeek: 2,
        startTime: '14:00:00',
        endTime: '18:00:00',
        isActive: true,
      },
    ];

    const result = await service.update('professional-1', nuevaDisponibilidad as any);

    expect(queryRunner.connect).toHaveBeenCalled();
    expect(queryRunner.startTransaction).toHaveBeenCalled();

    expect(queryRunner.manager.delete).toHaveBeenCalledWith(Availability, {
      professional: { id: 'professional-1' },
    });

    expect(availabilityRepo.create).toHaveBeenCalledTimes(2);

    expect(queryRunner.manager.save).toHaveBeenCalledWith([
      {
        ...nuevaDisponibilidad[0],
        professional: { id: 'professional-1' },
      },
      {
        ...nuevaDisponibilidad[1],
        professional: { id: 'professional-1' },
      },
    ]);

    expect(queryRunner.commitTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  it('debe hacer rollback si ocurre un error al guardar la configuración de disponibilidad', async () => {
    queryRunner.manager.save.mockRejectedValue(new Error('Error de base de datos'));

    const nuevaDisponibilidad = [
      {
        dayOfWeek: 3,
        startTime: '08:00:00',
        endTime: '12:00:00',
        isActive: true,
      },
    ];

    await expect(
      service.update('professional-1', nuevaDisponibilidad as any),
    ).rejects.toThrow('Error de base de datos');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();
  });
});