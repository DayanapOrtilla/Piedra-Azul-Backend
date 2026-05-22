import { BadRequestException } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentStatus } from '../../../shared/enum/appointment-status.enum';
import { UserRole } from '../../../shared/enum/user-role.enum';

describe('AppointmentService - nuevos requisitos', () => {
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

  it('debe impedir crear una cita si el profesional ya tiene una cita en la misma fecha y hora', async () => {
    availabilityRepo.findOne.mockResolvedValue({
      id: 'availability-1',
      isActive: true,
    });

    appointmentRepo.findOne
      .mockResolvedValueOnce({ id: 'appointment-existente' })
      .mockResolvedValueOnce(null);

    const dto = {
      date: '2026-05-03',
      time: '09:00:00',
      status: AppointmentStatus.PENDIENTE,
      patientId: '11111111-1111-1111-1111-111111111111',
      professionalId: '22222222-2222-2222-2222-222222222222',
    };

    await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);

    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it('debe impedir crear una cita si el paciente ya tiene una cita en la misma fecha y hora', async () => {
    availabilityRepo.findOne.mockResolvedValue({
      id: 'availability-1',
      isActive: true,
    });

    appointmentRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'conflicto-paciente' });

    const dto = {
      date: '2026-05-03',
      time: '10:00:00',
      status: AppointmentStatus.PENDIENTE,
      patientId: '11111111-1111-1111-1111-111111111111',
      professionalId: '22222222-2222-2222-2222-222222222222',
    };

    await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);

    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it('debe impedir crear una cita si el profesional no tiene disponibilidad activa ese día', async () => {
    availabilityRepo.findOne.mockResolvedValue(null);

    const dto = {
      date: '2026-05-03',
      time: '11:00:00',
      status: AppointmentStatus.PENDIENTE,
      patientId: '11111111-1111-1111-1111-111111111111',
      professionalId: '22222222-2222-2222-2222-222222222222',
    };

    await expect(service.create(dto as any)).rejects.toThrow(BadRequestException);

    expect(appointmentRepo.findOne).not.toHaveBeenCalled();
    expect(appointmentRepo.save).not.toHaveBeenCalled();
  });

  it('debe listar citas filtradas por médico o terapista y fecha', async () => {
    appointmentRepo.find.mockResolvedValue([]);

    await service.findByUser(
      'admin-id',
      UserRole.ADMINISTRADOR,
      '2026-05-03',
      '22222222-2222-2222-2222-222222222222',
    );

    expect(appointmentRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        relations: ['patient', 'professional', 'patient.user', 'professional.user'],
        order: { time: 'ASC' },
        where: {
          professional: {
            id: '22222222-2222-2222-2222-222222222222',
          },
          date: '2026-05-03',
        },
      }),
    );
  });

  it('debe exportar citas en formato CSV compatible con hojas de cálculo', async () => {
    jest.spyOn(service, 'findByUser').mockResolvedValue([
      {
        time: '08:00:00',
        patient: {
          document: '1001234567',
          firstName: 'Daniel',
          lastName: 'Zuniga',
          phone: '3001234567',
        },
      },
      {
        time: '08:30:00',
        patient: {
          document: '1007654321',
          firstName: 'Laura',
          lastName: 'Perez',
          phone: '3109876543',
        },
      },
    ] as any);

    const csv = await service.exportToCsv(
      '22222222-2222-2222-2222-222222222222',
      '2026-05-03',
    );

    expect(csv).toContain('Hora,Documento,Nombre Completo,Celular');
    expect(csv).toContain('08:00:00,1001234567,Daniel Zuniga,3001234567');
    expect(csv).toContain('08:30:00,1007654321,Laura Perez,3109876543');
  });
});