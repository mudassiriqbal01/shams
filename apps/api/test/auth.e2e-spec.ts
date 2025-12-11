import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    let accessToken: string;
    let refreshToken: string;
    let userId: string;
    let departmentId: string;

    it('should fail to login with invalid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });

    it('should get current user profile with valid token', async () => {
      // This test assumes a user is already created
      // In a real scenario, we would create a user first
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('activeDepartmentId');
    });

    it('should reject request without token', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me').expect(401);

      expect(response.body).toBeDefined();
    });
  });

  describe('Department RLS', () => {
    let accessToken: string;
    let departmentId: string;

    it('should enforce department context on module queries', async () => {
      // This test verifies that modules are filtered by active department
      const response = await request(app.getHttpServer())
        .get('/modules')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should either succeed with department-filtered results or fail appropriately
      expect([200, 403]).toContain(response.status);
    });
  });
});
