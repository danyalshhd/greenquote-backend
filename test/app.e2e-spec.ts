/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/')
      .expect(200)
      .expect('Hello World!');
  });

  // Example: Integration test for a protected endpoint (adjust path and payload as needed)
  it('/auth/login (POST) - should fail with wrong credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  // Example: Integration test for a non-existent route
  it('/notfound (GET) - should return 404', async () => {
    const res = await request(app.getHttpServer()).get('/notfound');
    expect(res.status).toBe(404);
  });
});

describe('Quotes (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    // Register a user and get token
    const email = `test${Date.now()}@example.com`;
    const password = 'testpass';
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ fullName: 'Test User', email, password });
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password });
    token = res.body.data.accessToken || res.body.data.token || res.body.data;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a quote', async () => {
    const quoteDto = {
      fullName: 'Test User',
      email: 'testuser@example.com',
      address: '123 Main St',
      monthlyConsumptionKwh: 400,
      systemSizeKw: 5,
      downPayment: 1000,
    };
    const res = await request(app.getHttpServer())
      .post('/api/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send(quoteDto);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
  });

  it('should list my quotes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/quotes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
