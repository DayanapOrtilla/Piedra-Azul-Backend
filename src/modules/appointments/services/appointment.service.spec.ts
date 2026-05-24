import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentService } from './appointment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentHistory } from '../entities/appointment-history.entity';
import { Availability } from '../../availabilities/entities/availability.entity';

describe('AppointmentService (integración)', () => {
  let service: AppointmentService;

  const mockAppointmentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockHistoryRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockAvailabilityRepo = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
        { provide: getRepositoryToken(AppointmentHistory), useValue: mockHistoryRepo },
        { provide: getRepositoryToken(Availability), useValue: mockAvailabilityRepo },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findByUser', () => {
    it('debe retornar todas las citas para rol ADMINISTRADOR', async () => {
      const mockCitas = [
        { id: '1', date: '2026-05-01', time: '08:00', status: 'CONFIRMADA' },
        { id: '2', date: '2026-05-01', time: '09:00', status: 'PENDIENTE' },
      ];
      mockAppointmentRepo.find.mockResolvedValue(mockCitas);

      const result = await service.findByUser('', 'ADMINISTRADOR');

      expect(result).toEqual(mockCitas);
      expect(mockAppointmentRepo.find).toHaveBeenCalledTimes(1);
    });

    it('debe filtrar citas por fecha para rol ADMINISTRADOR', async () => {
      const mockCitas = [{ id: '1', date: '2026-05-01', time: '08:00' }];
      mockAppointmentRepo.find.mockResolvedValue(mockCitas);

      const result = await service.findByUser('', 'ADMINISTRADOR', '2026-05-01');

      expect(result).toEqual(mockCitas);
      expect(mockAppointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ date: '2026-05-01' }),
        })
      );
    });

    it('debe filtrar citas por paciente para rol PACIENTE', async () => {
      const mockCitas = [{ id: '1', date: '2026-05-01', time: '08:00' }];
      mockAppointmentRepo.find.mockResolvedValue(mockCitas);

      const userId = 'user-123';
      await service.findByUser(userId, 'PACIENTE');

      expect(mockAppointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            patient: { user: { id: userId } },
          }),
        })
      );
    });
  });

  describe('create', () => {
    it('debe lanzar error si el profesional no tiene disponibilidad', async () => {
      mockAvailabilityRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          date: new Date('2026-05-05') as any,
          time: '08:00',
          professionalId: 'prof-1',
          patientId: 'pat-1',
          status: 'CONFIRMADA' as any,
        })
      ).rejects.toThrow('El profesional no tiene agenda en el día seleccionado');
    });

    it('debe lanzar error si ya existe una cita en el mismo horario', async () => {
      mockAvailabilityRepo.findOne.mockResolvedValue({ id: 'avail-1', isActive: true });
      mockAppointmentRepo.findOne.mockResolvedValue({ id: 'existing-appt' });

      await expect(
        service.create({
          date: new Date('2026-05-05') as any,
          time: '08:00',
          professionalId: 'prof-1',
          patientId: 'pat-1',
          status: 'CONFIRMADA' as any,
        })
      ).rejects.toThrow('Ya existe una cita para este profesional en la fecha y hora seleccionadas');
    });
  });

  describe('exportToCsv', () => {
    it('debe generar CSV con encabezados correctos', async () => {
      mockAppointmentRepo.find.mockResolvedValue([]);

      const result = await service.exportToCsv();

      expect(result).toContain('Hora,Documento,Nombre Completo,Celular');
    });

    it('debe incluir datos del paciente en el CSV', async () => {
      mockAppointmentRepo.find.mockResolvedValue([
        {
          time: '08:00',
          patient: { document: '123456', firstName: 'Juan', lastName: 'García', phone: '3001234567' },
          professional: { user: {} },
        },
      ]);

      const result = await service.exportToCsv();

      expect(result).toContain('08:00');
      expect(result).toContain('123456');
      expect(result).toContain('Juan García');
      expect(result).toContain('3001234567');
    });
  });
});