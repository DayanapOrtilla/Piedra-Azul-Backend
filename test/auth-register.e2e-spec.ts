import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, Controller, Post, Body } from '@nestjs/common';
import request from 'supertest';

@Controller('register')
class TestController {
  @Post()
  register(@Body() body: any) {
    if (!body.email || !body.password) {
      throw new Error('Bad Request');
    }
    return { message: 'ok' };
  }
}

describe('Auth Register (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('POST /register - válido', () => {
    return request(app.getHttpServer())
      .post('/register')
      .send({
        email: 'test@test.com',
        password: '123456',
      })
      .expect(201);
  });

  it('POST /register - inválido', () => {
    return request(app.getHttpServer())
      .post('/register')
      .send({})
      .expect(500);
  });

  afterAll(async () => {
    await app.close();
  });
});
