import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepo: any;

  beforeEach(() => {
    patientRepo = {
      save: jest.fn(),
      find: jest.fn(),
      preload: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    service = new PatientsService(patientRepo);
  });

  it('debe limpiar guiones al crear un paciente', async () => {
    patientRepo.save.mockImplementation(async (data: any) => data);

    const result = await service.create({
      document: '-12345-',
      firstName: 'Juan',
      lastName: 'Pérez',
    } as any);

    expect(patientRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ document: '12345' }),
    );
    expect(result.document).toBe('12345');
  });

  it('debe lanzar InternalServerErrorException si falla el guardado en create', async () => {
    patientRepo.save.mockRejectedValue(new Error('db error'));

    await expect(
      service.create({ document: '12345' } as any),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('debe lanzar NotFoundException cuando preload retorna null en update', async () => {
    patientRepo.preload.mockResolvedValue(null);

    await expect(service.update('p1', { firstName: 'Nuevo' } as any)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('debe desactivar un paciente existente', async () => {
    const patient = { id: 'p1', isActive: true };
    jest.spyOn(service, 'findOne').mockResolvedValue(patient as any);
    patientRepo.save.mockResolvedValue({ ...patient, isActive: false });

    const result = await service.deactivate('p1');

    expect(patientRepo.save).toHaveBeenCalledWith({ id: 'p1', isActive: false });
    expect(result.isActive).toBe(false);
  });
});
