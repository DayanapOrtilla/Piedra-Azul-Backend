import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { AppointmentService } from './appointment.service';
import { Appointment } from '../entities/appointment.entity';
import { Availability } from '../../availabilities/entities/availability.entity';
import { AppointmentStatus } from '../../../shared/enum/appointment-status.enum';
import { UserRole } from '../../../shared/enum/user-role.enum';

// ─── Factories ────────────────────────────────────────────────────────────────

function makeAvailability(overrides: Partial<Availability> = {}): Availability {
  return {
    id: 'avail-1',
    dayOfWeek: 1, // Lunes
    startTime: '08:00:00',
    endTime: '12:00:00',
    isActive: true,
    professional: { id: 'prof-1' } as any,
    ...overrides,
  };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    date: new Date('2026-03-23'),
    time: '09:00',
    status: AppointmentStatus.PENDIENTE,
    patient: { id: 'pat-1' } as any,
    professional: { id: 'prof-1' } as any,
    ...overrides,
  };
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let availabilityRepo: jest.Mocked<Repository<Availability>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            create:  jest.fn(),
            save:    jest.fn(),
            find:    jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Availability),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service          = module.get<AppointmentService>(AppointmentService);
    appointmentRepo  = module.get(getRepositoryToken(Appointment));
    availabilityRepo = module.get(getRepositoryToken(Availability));
  });

  afterEach(() => jest.clearAllMocks());

  // HU 1.2 — El agendador crea una nueva cita manualmente

  describe('create()', () => {
    const baseDto = {
      date: new Date('2026-03-23T12:00:00'), // Lunes → getUTCDay() = 1
      time: '09:00',
      status: AppointmentStatus.PENDIENTE,
      patientId: 'pat-1',
      professionalId: 'prof-1',
    };

    it('[CA1] crea y guarda la cita cuando el profesional tiene disponibilidad ese día', async () => {
      availabilityRepo.findOne.mockResolvedValue(makeAvailability({ dayOfWeek: 1 }));
      const expected = makeAppointment();
      appointmentRepo.create.mockReturnValue(expected);
      appointmentRepo.save.mockResolvedValue(expected);

      const result = await service.create(baseDto);

      expect(availabilityRepo.findOne).toHaveBeenCalledWith({
        where: {
          professional: { id: 'prof-1' },
          dayOfWeek: expect.any(Number),
          isActive: true,
        },
      });
      expect(appointmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          time: '09:00',
          status: AppointmentStatus.PENDIENTE,
          patient:      { id: 'pat-1' },
          professional: { id: 'prof-1' },
        }),
      );
      expect(appointmentRepo.save).toHaveBeenCalled();
      expect(result).toEqual(expected);
    });

    it('[CA2] lanza BadRequestException si el profesional NO tiene disponibilidad ese día', async () => {
      availabilityRepo.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(baseDto)).rejects.toThrow(
        'El profesional no tiene agenda en el dia seleccionado',
      );
      expect(appointmentRepo.save).not.toHaveBeenCalled();
    });

    it('[CA3] lanza BadRequestException si la disponibilidad existe pero está inactiva', async () => {
      // El query ya filtra isActive:true, así que el repo devuelve null
      availabilityRepo.findOne.mockResolvedValue(null);

      await expect(service.create(baseDto)).rejects.toThrow(BadRequestException);
      expect(appointmentRepo.create).not.toHaveBeenCalled();
    });

    it('[CA4] calcula correctamente el día de la semana para un Martes (dayOfWeek = 2)', async () => {
      const dtoMartes = { ...baseDto, date: new Date('2026-03-24T12:00:00') };
      availabilityRepo.findOne.mockResolvedValue(makeAvailability({ dayOfWeek: 2 }));
      const expected = makeAppointment();
      appointmentRepo.create.mockReturnValue(expected);
      appointmentRepo.save.mockResolvedValue(expected);

      await service.create(dtoMartes);

      expect(availabilityRepo.findOne).toHaveBeenCalledWith({
        where: expect.objectContaining({ dayOfWeek: 2 }),
      });
    });

    it('[CA5] no crea dos citas si el repositorio falla al guardar (propagación de error)', async () => {
      availabilityRepo.findOne.mockResolvedValue(makeAvailability());
      appointmentRepo.create.mockReturnValue(makeAppointment());
      appointmentRepo.save.mockRejectedValue(new Error('DB constraint'));

      await expect(service.create(baseDto)).rejects.toThrow('DB constraint');
    });
  });

  // HU 1.1 — El agendador lista citas por médico y fecha

  describe('findAll()', () => {
    it('[CA1] retorna lista de citas con relaciones patient y professional, ordenadas DESC', async () => {
      const citas = [makeAppointment({ id: 'a1' }), makeAppointment({ id: 'a2' })];
      appointmentRepo.find.mockResolvedValue(citas);

      const result = await service.findAll();

      expect(appointmentRepo.find).toHaveBeenCalledWith({
        relations: ['professional', 'patient'],
        order: { date: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('[CA2] retorna arreglo vacío cuando no hay citas registradas', async () => {
      appointmentRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('[CA3] propaga errores del repositorio al llamador', async () => {
      appointmentRepo.find.mockRejectedValue(new Error('DB error'));

      await expect(service.findAll()).rejects.toThrow('DB error');
    });
  });

  // findByUser() — Filtrado por rol, fecha y profesional

  describe('findByUser()', () => {
    beforeEach(() => {
      appointmentRepo.find.mockResolvedValue([]);
    });

    it('[CA1] el AGENDADOR ve todas las citas (sin restricción de userId)', async () => {
      await service.findByUser('user-ag', UserRole.AGENDADOR);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where).not.toHaveProperty('patient');
      expect(args.where).not.toHaveProperty('professional');
    });

    it('[CA2] el ADMINISTRADOR ve todas las citas (sin restricción de userId)', async () => {
      await service.findByUser('user-admin', UserRole.ADMINISTRADOR);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where).not.toHaveProperty('patient');
      expect(args.where).not.toHaveProperty('professional');
    });

    it('[CA3] el PACIENTE solo ve sus propias citas filtradas por su userId', async () => {
      await service.findByUser('user-pac', UserRole.PACIENTE);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where.patient).toEqual({ user: { id: 'user-pac' } });
    });

    it('[CA4] el MÉDICO solo ve sus propias citas filtradas por su userId', async () => {
      await service.findByUser('user-med', UserRole.MEDICO);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where.professional).toEqual({ user: { id: 'user-med' } });
    });

    it('[CA5] el TERAPISTA solo ve sus propias citas filtradas por su userId', async () => {
      await service.findByUser('user-ter', UserRole.TERAPISTA);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where.professional).toEqual({ user: { id: 'user-ter' } });
    });

    it('[CA6] aplica filtro por fecha cuando se proporciona', async () => {
      await service.findByUser('user-ag', UserRole.AGENDADOR, '2026-03-23');

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where.date).toBe('2026-03-23');
    });

    it('[CA7] aplica filtro por professionalId cuando se proporciona', async () => {
      await service.findByUser('user-ag', UserRole.AGENDADOR, undefined, 'prof-99');

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.where.professional).toEqual({ id: 'prof-99' });
    });

    it('[CA8] incluye todas las relaciones necesarias para mostrar datos completos', async () => {
      await service.findByUser('user-ag', UserRole.AGENDADOR);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.relations).toContain('patient');
      expect(args.relations).toContain('professional');
      expect(args.relations).toContain('patient.user');
      expect(args.relations).toContain('professional.user');
    });

    it('[CA9] ordena los resultados por fecha descendente', async () => {
      await service.findByUser('user-ag', UserRole.AGENDADOR);

      const args = appointmentRepo.find.mock.calls[0][0] as any;
      expect(args.order).toEqual({ date: 'DESC' });
    });
  });

  // findOne()

  describe('findOne()', () => {
    it('[CA1] retorna la cita cuando el id existe', async () => {
      const cita = makeAppointment();
      appointmentRepo.findOne.mockResolvedValue(cita);

      const result = await service.findOne('appt-1');

      expect(result).toEqual(cita);
      expect(appointmentRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'appt-1' } }),
      );
    });

    it('[CA2] retorna null cuando el id no existe', async () => {
      appointmentRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne('id-inexistente');

      expect(result).toBeNull();
    });
  });
});
