import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepo: any;
  let queryRunner: any;
  let dataSource: any;

  beforeEach(() => {
    availabilityRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      merge: jest.fn((entity) => entity),
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

  it('debe crear 7 horarios base para un profesional', async () => {
    availabilityRepo.save.mockImplementation(async (data: any) => data);

    const result = await service.createDefaultSchedule({ id: 'pro1' } as any);

    expect(result).toHaveLength(7);
    expect(availabilityRepo.create).toHaveBeenCalledTimes(7);
    expect(result[0]).toEqual(
      expect.objectContaining({
        dayOfWeek: 0,
        startTime: '08:00:00',
        endTime: '12:00:00',
        isActive: false,
      }),
    );
  });

  it('debe validar que la hora fin sea mayor que la hora inicio', async () => {
    await expect(
      service.update('pro1', [
        { dayOfWeek: 1, startTime: '12:00:00', endTime: '08:00:00', isActive: true },
      ] as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe lanzar NotFoundException si no existe el horario al buscar por id', async () => {
    availabilityRepo.findOne.mockResolvedValue(null);

    await expect(service.findById('a1')).rejects.toThrow(NotFoundException);
  });

  it('debe alternar el estado isActive en deactivate', async () => {
    availabilityRepo.findOne.mockResolvedValue({ id: 'a1', isActive: false });
    availabilityRepo.save.mockImplementation(async (data: any) => data);

    const result = await service.deactivate('a1');

    expect(result.isActive).toBe(true);
  });
});
