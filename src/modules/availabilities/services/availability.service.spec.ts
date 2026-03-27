import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository, DataSource, QueryRunner } from 'typeorm';

import { AvailabilityService } from './availability.service';
import { Availability } from '../entities/availability.entity';

// ─── Factory ─────────────────────────────────────────────────────────────────

function makeAvailability(overrides: Partial<Availability> = {}): Availability {
  return {
    id: 'avail-1',
    dayOfWeek: 1,
    startTime: '08:00:00',
    endTime: '12:00:00',
    isActive: true,
    professional: { id: 'prof-1' } as any,
    ...overrides,
  };
}

function makeQueryRunner(): jest.Mocked<QueryRunner> {
  return {
    connect:           jest.fn().mockResolvedValue(undefined),
    startTransaction:  jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release:           jest.fn().mockResolvedValue(undefined),
    manager: {
      delete: jest.fn().mockResolvedValue(undefined),
      save:   jest.fn(),
    },
  } as any;
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepo: jest.Mocked<Repository<Availability>>;
  let queryRunner: ReturnType<typeof makeQueryRunner>;

  beforeEach(async () => {
    queryRunner = makeQueryRunner();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        {
          provide: getRepositoryToken(Availability),
          useValue: {
            create:  jest.fn(),
            save:    jest.fn(),
            find:    jest.fn(),
            findOne: jest.fn(),
            merge:   jest.fn((entity) => entity),
          },
        },
        {
          provide: DataSource,
          useValue: {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
          },
        },
      ],
    }).compile();

    service          = module.get<AvailabilityService>(AvailabilityService);
    availabilityRepo = module.get(getRepositoryToken(Availability));
  });

  afterEach(() => jest.clearAllMocks());

  
  // HU 3.1 — Admin registra un profesional (horario inicial)
  

  describe('createDefaultSchedule()', () => {
    it('[CA1] genera exactamente 7 registros de disponibilidad, uno por día', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      availabilityRepo.save.mockResolvedValue([] as any);

      await service.createDefaultSchedule({ id: 'prof-1' } as any);

      expect(availabilityRepo.create).toHaveBeenCalledTimes(7);
    });

    it('[CA2] todos los días se crean con isActive = false por defecto', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      availabilityRepo.save.mockResolvedValue([] as any);

      await service.createDefaultSchedule({ id: 'prof-1' } as any);

      const calls = availabilityRepo.create.mock.calls.map((c) => c[0] as any);
      calls.forEach((call) => expect(call.isActive).toBe(false));
    });

    it('[CA3] cubre los días 0 (Domingo) hasta 6 (Sábado) sin repetir', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      availabilityRepo.save.mockResolvedValue([] as any);

      await service.createDefaultSchedule({ id: 'prof-1' } as any);

      const dias = availabilityRepo.create.mock.calls
        .map((c) => (c[0] as any).dayOfWeek)
        .sort((a, b) => a - b);
      expect(dias).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

    it('[CA4] asigna el horario por defecto 08:00 – 12:00 a cada día', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      availabilityRepo.save.mockResolvedValue([] as any);

      await service.createDefaultSchedule({ id: 'prof-1' } as any);

      const calls = availabilityRepo.create.mock.calls.map((c) => c[0] as any);
      calls.forEach((call) => {
        expect(call.startTime).toBe('08:00:00');
        expect(call.endTime).toBe('12:00:00');
      });
    });
  });

  
  // HU 3.2 — Admin configura disponibilidad de un profesional
  

  describe('update()', () => {
    const validPayload = [
      { dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00', isActive: true },
      { dayOfWeek: 3, startTime: '09:00:00', endTime: '13:00:00', isActive: true },
    ];

    it('[CA1] persiste la configuración usando una transacción completa', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      (queryRunner.manager.save as jest.Mock).mockResolvedValue(validPayload);

      await service.update('prof-1', validPayload as any);

      expect(queryRunner.connect).toHaveBeenCalled();
      expect(queryRunner.startTransaction).toHaveBeenCalled();
      expect(queryRunner.manager.delete).toHaveBeenCalledWith(Availability, {
        professional: { id: 'prof-1' },
      });
      expect(queryRunner.manager.save).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled();
    });

    it('[CA2] lanza BadRequestException si horaFin < horaInicio en día activo', async () => {
      const invalid = [{ dayOfWeek: 1, startTime: '12:00:00', endTime: '08:00:00', isActive: true }];

      await expect(service.update('prof-1', invalid as any)).rejects.toThrow(BadRequestException);
    });

    it('[CA3] lanza BadRequestException si horaFin === horaInicio en día activo', async () => {
      const invalid = [{ dayOfWeek: 2, startTime: '10:00:00', endTime: '10:00:00', isActive: true }];

      await expect(service.update('prof-1', invalid as any)).rejects.toThrow(BadRequestException);
    });

    it('[CA4] acepta horaFin === horaInicio si el día está inactivo (no se valida)', async () => {
      const inactive = [{ dayOfWeek: 0, startTime: '10:00:00', endTime: '10:00:00', isActive: false }];
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      (queryRunner.manager.save as jest.Mock).mockResolvedValue(inactive);

      await expect(service.update('prof-1', inactive as any)).resolves.not.toThrow();
    });

    it('[CA5] hace rollback y libera el queryRunner si ocurre un error en el guardado', async () => {
      availabilityRepo.create.mockImplementation((d: any) => ({ ...d } as Availability));
      (queryRunner.manager.save as jest.Mock).mockRejectedValue(new Error('DB fallo'));

      await expect(service.update('prof-1', validPayload as any)).rejects.toThrow('DB fallo');

      expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(queryRunner.release).toHaveBeenCalled(); // siempre se libera
    });

    it('[CA6] el mensaje de error indica el día con conflicto de horario', async () => {
      const invalid = [{ dayOfWeek: 4, startTime: '14:00:00', endTime: '10:00:00', isActive: true }];

      await expect(service.update('prof-1', invalid as any)).rejects.toThrow(/día 4/);
    });
  });

  
  // findByProfessionalId()
  

  describe('findByProfessionalId()', () => {
    it('[CA1] retorna horarios del profesional ordenados de menor a mayor día', async () => {
      const horarios = [makeAvailability({ dayOfWeek: 3 }), makeAvailability({ dayOfWeek: 1 })];
      availabilityRepo.find.mockResolvedValue(horarios);

      const result = await service.findByProfessionalId('prof-1');

      expect(availabilityRepo.find).toHaveBeenCalledWith({
        where: { professional: { id: 'prof-1' } },
        order: { dayOfWeek: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('[CA2] retorna arreglo vacío si el profesional no tiene horarios configurados', async () => {
      availabilityRepo.find.mockResolvedValue([]);

      const result = await service.findByProfessionalId('prof-sin-horario');

      expect(result).toEqual([]);
    });
  });

  
  // findById()
  

  describe('findById()', () => {
    it('[CA1] retorna el registro cuando el id existe', async () => {
      availabilityRepo.findOne.mockResolvedValue(makeAvailability());

      const result = await service.findById('avail-1');

      expect(result.id).toBe('avail-1');
    });

    it('[CA2] lanza NotFoundException cuando el id no existe', async () => {
      availabilityRepo.findOne.mockResolvedValue(null);

      await expect(service.findById('no-existe')).rejects.toThrow(NotFoundException);
      await expect(service.findById('no-existe')).rejects.toThrow(
        'El horario de disponibilidad no existe',
      );
    });
  });

  
  // deactivate()
  

  describe('deactivate()', () => {
    it('[CA1] cambia isActive de true a false (toggle on → off)', async () => {
      const avail = makeAvailability({ isActive: true });
      availabilityRepo.findOne.mockResolvedValue(avail);
      availabilityRepo.merge.mockReturnValue({ ...avail, isActive: false } as any);
      availabilityRepo.save.mockResolvedValue({ ...avail, isActive: false });

      const result = await service.deactivate('avail-1');

      expect(result.isActive).toBe(false);
    });

    it('[CA2] cambia isActive de false a true (toggle off → on)', async () => {
      const avail = makeAvailability({ isActive: false });
      availabilityRepo.findOne.mockResolvedValue(avail);
      availabilityRepo.merge.mockReturnValue({ ...avail, isActive: true } as any);
      availabilityRepo.save.mockResolvedValue({ ...avail, isActive: true });

      const result = await service.deactivate('avail-1');

      expect(result.isActive).toBe(true);
    });

    it('[CA3] lanza NotFoundException si el registro no existe', async () => {
      availabilityRepo.findOne.mockResolvedValue(null);

      await expect(service.deactivate('no-existe')).rejects.toThrow(NotFoundException);
    });
  });

  
  // findAll()
  

  describe('findAll()', () => {
    it('[CA1] retorna todos los horarios con su profesional asociado, ordenados', async () => {
      availabilityRepo.find.mockResolvedValue([makeAvailability()]);

      const result = await service.findAll();

      expect(availabilityRepo.find).toHaveBeenCalledWith({
        relations: ['professional'],
        order: { dayOfWeek: 'ASC', startTime: 'ASC' },
      });
      expect(result).toHaveLength(1);
    });
  });
});
