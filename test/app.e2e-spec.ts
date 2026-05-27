import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Sistema - Flujo de citas (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health check', () => {
  it('GET /api sin token debe retornar 401', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(401);
  });
});

  describe('Autenticación', () => {
    it('POST /api/auth/login debe rechazar credenciales inválidas', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ user: 'usuario_invalido', password: 'password_invalido' })
        .expect(401);
    });
  });

  describe('Endpoints protegidos', () => {
    it('GET /api/appointments sin token debe retornar 401', () => {
      return request(app.getHttpServer())
        .get('/api/appointments')
        .expect(401);
    });

    it('GET /api/patients sin token debe retornar 401', () => {
      return request(app.getHttpServer())
        .get('/api/patients')
        .expect(401);
    });

    it('GET /api/professionals sin token debe retornar 401', () => {
      return request(app.getHttpServer())
        .get('/api/professionals')
        .expect(401);
    });
  });
});