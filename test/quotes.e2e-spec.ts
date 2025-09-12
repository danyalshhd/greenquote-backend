/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { RedisService } from '../services/redis.service';

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
        const loginRes = await request(app.getHttpServer())
            .post('/api/auth/login')
            .send({ email, password });
        token =
            loginRes.body.data.accessToken ||
            loginRes.body.data.token ||
            loginRes.body.accessToken;
    });

    afterAll(async () => {
        await app.close();
    });

    it('should create a quote', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/quotes')
            .set('Authorization', `Bearer ${token}`)
            .send({
                fullName: 'Test User',
                email: 'test@example.com',
                address: '123 Main St',
                monthlyConsumptionKwh: 400,
                systemSizeKw: 5,
                downPayment: 1000,
            });
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
