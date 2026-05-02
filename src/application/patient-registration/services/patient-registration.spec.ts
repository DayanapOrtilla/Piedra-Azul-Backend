import { BadRequestException } from '@nestjs/common';
import { PatientRegistrationService } from './patient-registration.service';
import { PatientGender } from '../../../shared/enum/patient-gender.enum';

describe('PatientRegistrationService', () => {
  let service: PatientRegistrationService;
  let userService: any;
  let patientService: any;
  let processor: any;

  beforeEach(() => {
    userService = {
      findByUserName: jest.fn(),
    };

    patientService = {
      findByDocument: jest.fn(),
    };

    processor = {
      processRegistration: jest.fn(),
    };

    service = new PatientRegistrationService(
      userService,
      patientService,
      processor,
    );
  });

  it('debe impedir registrar un paciente web si ya existe un usuario con el mismo documento', async () => {
    userService.findByUserName.mockResolvedValue({
      id: 'user-existente',
      user: '1001234567',
    });

    const dto = {
      firstName: 'Daniel',
      lastName: 'Zuniga',
      document: '1001234567',
      gender: PatientGender.MASCULINO,
      phone: '3001234567',
      email: 'daniel@test.com',
      password: 'Password123',
      isActive: true,
    };

    await expect(service.register(dto as any)).rejects.toThrow(BadRequestException);

    expect(userService.findByUserName).toHaveBeenCalledWith('1001234567');
    expect(patientService.findByDocument).not.toHaveBeenCalled();
    expect(processor.processRegistration).not.toHaveBeenCalled();
  });

  it('debe vincular el registro web con un paciente existente cuando el documento ya existe como paciente pero no como usuario', async () => {
    userService.findByUserName.mockResolvedValue(null);

    const pacienteExistente = {
      id: 'patient-1',
      document: '1001234567',
      firstName: 'Daniel',
    };

    patientService.findByDocument.mockResolvedValue(pacienteExistente);

    processor.processRegistration.mockResolvedValue({
      message: 'Usuario vinculado a paciente',
      id: 'user-1',
      role: 'PACIENTE',
    });

    const dto = {
      firstName: 'Daniel',
      lastName: 'Zuniga',
      document: '1001234567',
      gender: PatientGender.MASCULINO,
      phone: '3001234567',
      email: 'daniel@test.com',
      password: 'Password123',
      isActive: true,
    };

    const result = await service.register(dto as any);

    expect(userService.findByUserName).toHaveBeenCalledWith('1001234567');
    expect(patientService.findByDocument).toHaveBeenCalledWith('1001234567');
    expect(processor.processRegistration).toHaveBeenCalledWith(dto, pacienteExistente);
    expect(result.message).toBe('Usuario vinculado a paciente');
  });

  it('debe crear un paciente nuevo cuando no existe paciente ni usuario con el documento enviado', async () => {
    userService.findByUserName.mockResolvedValue(null);
    patientService.findByDocument.mockResolvedValue(null);

    processor.processRegistration.mockResolvedValue({
      message: 'Paciente con usuario creado con éxito',
      id: 'user-1',
      role: 'PACIENTE',
    });

    const dto = {
      firstName: 'Laura',
      lastName: 'Perez',
      document: '1007654321',
      gender: PatientGender.FEMENINO,
      phone: '3109876543',
      email: 'laura@test.com',
      password: 'Password123',
      isActive: true,
    };

    const result = await service.register(dto as any);

    expect(userService.findByUserName).toHaveBeenCalledWith('1007654321');
    expect(patientService.findByDocument).toHaveBeenCalledWith('1007654321');
    expect(processor.processRegistration).toHaveBeenCalledWith(dto, null);
    expect(result.message).toBe('Paciente con usuario creado con éxito');
  });
});