import { BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepo: any;
  let availabilityRepo: any;

  beforeEach(() => {
    appointmentRepo = {
      create: jest.fn((data) => data),
      save: jest.fn(async (data) => data),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    availabilityRepo = {
      findOne: jest.fn(),
    };

    service = new AppointmentService(appointmentRepo, availabilityRepo);
  });

  it('debe crear una cita cuando existe disponibilidad activa para el día', async () => {
    availabilityRepo.findOne.mockResolvedValue({ id: 'disp1' });

    const dto = {
      date: new Date('2026-03-30T00:00:00.000Z'),
      time: '09:00:00',
      status: 'PENDIENTE',
      patientId: '11111111-1111-1111-1111-111111111111',
      professionalId: '22222222-2222-2222-2222-222222222222',
    };

    const result = await service.create(dto as any);

    expect(availabilityRepo.findOne).toHaveBeenCalled();
    expect(appointmentRepo.create).toHaveBeenCalledWith({
      ...dto,
      patient: { id: dto.patientId },
      professional: { id: dto.professionalId },
    });
    expect(result.patient.id).toBe(dto.patientId);
  });

  it('debe lanzar BadRequestException cuando el profesional no tiene agenda ese día', async () => {
    availabilityRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        date: new Date('2026-03-30T00:00:00.000Z'),
        time: '09:00:00',
        status: 'PENDIENTE',
        patientId: '11111111-1111-1111-1111-111111111111',
        professionalId: '22222222-2222-2222-2222-222222222222',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('debe filtrar por paciente cuando el rol es PACIENTE', async () => {
    appointmentRepo.find.mockResolvedValue([]);

    await service.findByUser('user-1', UserRole.PACIENTE);

    expect(appointmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patient: { user: { id: 'user-1' } } },
      }),
    );
  });

  it('debe sobrescribir el filtro profesional cuando recibe professionalId explícito', async () => {
    appointmentRepo.find.mockResolvedValue([]);

    await service.findByUser('user-1', UserRole.ADMINISTRADOR, '2026-03-30', 'pro-1');

    expect(appointmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { date: '2026-03-30', professional: { id: 'pro-1' } },
      }),
    );
  });
});
