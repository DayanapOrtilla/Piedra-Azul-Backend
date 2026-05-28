import { PatientRegistrationProcessor } from './patient-registration.processor';

describe('PatientRegistrationProcessor', () => {
  const userRepo = {
    create: jest.fn((data) => data),
    save: jest.fn(async (data) => ({ id: 1, ...data })),
  };

  const patientRepo = {
    create: jest.fn((data) => data),
    save: jest.fn(async (data) => ({ id: 1, ...data })),
  };

  const manager = {
    getRepository: jest.fn((entity) => {
      if (entity.name === 'User') return userRepo;
      if (entity.name === 'Patient') return patientRepo;
      return {};
    }),
  };

  const dataSource = {
    transaction: jest.fn(async (callback) => callback(manager)),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process patient registration without existing patient', async () => {
    const processor = new PatientRegistrationProcessor(dataSource as any, {} as any, {} as any);
    jest.spyOn(processor as any, 'createKeycloakUser').mockResolvedValue('keycloak-user-id');

    const dto: any = {
      email: 'test@test.com',
      password: '123456',
      firstName: 'Test',
      lastName: 'User',
      document: '123456',
      phone: '3000000000',
    };

    const result = await processor.processRegistration(dto, null);

    expect(result).toBeDefined();
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();
    expect(patientRepo.save).toHaveBeenCalled();
  });

  it('should process registration with existing patient', async () => {
    const processor = new PatientRegistrationProcessor(dataSource as any, {} as any, {} as any);
    jest.spyOn(processor as any, 'createKeycloakUser').mockResolvedValue('keycloak-user-id');

    const dto: any = {
      email: 'existing@test.com',
      password: '123456',
    };

    const existingPatient: any = {
      id: 10,
      email: 'existing@test.com',
    };

    const result = await processor.processRegistration(dto, existingPatient);

    expect(result).toBeDefined();
    expect(dataSource.transaction).toHaveBeenCalled();
    expect(userRepo.save).toHaveBeenCalled();
  });

  it('should throw when keycloak user creation fails', async () => {
    const processor = new PatientRegistrationProcessor(dataSource as any, {} as any, {} as any);
    jest.spyOn(processor as any, 'createKeycloakUser').mockRejectedValue(new Error('Keycloak error'));

    await expect(
      processor.processRegistration({ email: 'fail@test.com', password: '123456' } as any, null),
    ).rejects.toThrow('Keycloak error');
  });
});
