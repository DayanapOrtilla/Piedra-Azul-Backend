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

  it('should process patient registration', async () => {
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
  });
});
