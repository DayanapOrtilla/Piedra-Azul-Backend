import { InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PatientsService } from './patients.service';

describe('PatientsService', () => {
  let service: PatientsService;
  let patientRepo: any;

  beforeEach(() => {
    patientRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      preload: jest.fn(),
      remove: jest.fn(),
    };

    service = new PatientsService(patientRepo);
  });

  it('debe crear un paciente correctamente', async () => {
    const dto = {
      document: '1001234567',
      firstName: 'Daniel',
      lastName: 'Zuniga',
      phone: '3001234567',
    };

    patientRepo.save.mockResolvedValue({
      id: 'patient-1',
      ...dto,
    });

    const result = await service.create(dto as any);

    expect(patientRepo.save).toHaveBeenCalledWith(dto);
    expect(result.id).toBe('patient-1');
  });

  it('debe lanzar InternalServerErrorException si ocurre un error al crear paciente', async () => {
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    patientRepo.save.mockRejectedValue(new Error('db error'));

    await expect(service.create({} as any)).rejects.toThrow(
      InternalServerErrorException,
    );

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('debe listar todos los pacientes', async () => {
    patientRepo.find.mockResolvedValue([
      {
        id: 'patient-1',
        document: '1001234567',
      },
    ]);

    const result = await service.findAll();

    expect(patientRepo.find).toHaveBeenCalled();
    expect(result).toHaveLength(1);
  });

  it('debe buscar un paciente por id', async () => {
    const patient = {
      id: 'patient-1',
      document: '1001234567',
    };

    patientRepo.findOne.mockResolvedValue(patient);

    const result = await service.findOne('patient-1');

    expect(patientRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'patient-1' },
      relations: ['appointments'],
    });

    expect(result).toEqual(patient);
  });

  it('debe retornar null si el paciente no existe al buscar por id', async () => {
    patientRepo.findOne.mockResolvedValue(null);

    const result = await service.findOne('patient-no-existe');

    expect(patientRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'patient-no-existe' },
      relations: ['appointments'],
    });

    expect(result).toBeNull();
  });

  it('debe buscar paciente por documento', async () => {
    const patient = {
      id: 'patient-1',
      document: '1001234567',
    };

    patientRepo.findOne.mockResolvedValue(patient);

    const result = await service.findByDocument('1001234567');

    expect(patientRepo.findOne).toHaveBeenCalledWith({
      where: { document: '1001234567' },
    });

    expect(result).toEqual(patient);
  });

  it('debe actualizar un paciente existente', async () => {
    const patientUpdated = {
      id: 'patient-1',
      firstName: 'Nuevo nombre',
    };

    patientRepo.preload.mockResolvedValue(patientUpdated);
    patientRepo.save.mockResolvedValue(patientUpdated);

    const result = await service.update('patient-1', {
      firstName: 'Nuevo nombre',
    } as any);

    expect(patientRepo.preload).toHaveBeenCalledWith({
      id: 'patient-1',
      firstName: 'Nuevo nombre',
    });

    expect(patientRepo.save).toHaveBeenCalledWith(patientUpdated);
    expect(result).toEqual(patientUpdated);
  });

  it('debe lanzar NotFoundException si el paciente a actualizar no existe', async () => {
    patientRepo.preload.mockResolvedValue(null);

    await expect(
      service.update('patient-no-existe', { firstName: 'Nombre' } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('debe eliminar un paciente existente', async () => {
    const patient = {
      id: 'patient-1',
      document: '1001234567',
      appointments: [],
    };

    patientRepo.findOne.mockResolvedValue(patient);
    patientRepo.remove.mockResolvedValue(patient);

    const result = await service.remove('patient-1');

    expect(patientRepo.findOne).toHaveBeenCalledWith({
      where: { id: 'patient-1' },
      relations: ['appointments'],
    });

    expect(patientRepo.remove).toHaveBeenCalledWith(patient);
    expect(result).toEqual(patient);
  });

  it('debe lanzar NotFoundException si el paciente a eliminar no existe', async () => {
    patientRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('patient-no-existe')).rejects.toThrow(
      NotFoundException,
    );
  });
});