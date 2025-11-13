import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

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

    prisma = app.get(PrismaService);

    // Limpar dados de teste (na ordem correta das relações)
    try {
      const testEmails = ['newuser@test.com', 'duplicate@test.com'];
      const users = await prisma.db.user.findMany({
        where: { email: { in: testEmails } },
        select: { id: true },
      });
      const userIds = users.map((u) => u.id);

      if (userIds.length > 0) {
        await prisma.db.balance.deleteMany({
          where: { userId: { in: userIds } },
        });
        await prisma.db.user.deleteMany({ where: { id: { in: userIds } } });
      }
    } catch (error) {
      // Ignorar erros de cleanup se não houver dados
    }
  });

  afterAll(async () => {
    // Limpar dados de teste (na ordem correta das relações)
    const testEmails = ['newuser@test.com', 'duplicate@test.com'];
    const users = await prisma.db.user.findMany({
      where: { email: { in: testEmails } },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.db.balance.deleteMany({ where: { userId: { in: userIds } } });
      await prisma.db.user.deleteMany({ where: { id: { in: userIds } } });
    }

    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          name: 'New User',
          password: 'password123',
          role: 'PRODUCER',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('newuser@test.com');
          expect(res.body.user.name).toBe('New User');
          expect(res.body.user.role).toBe('PRODUCER');
          expect(res.body.user).not.toHaveProperty('password');
          accessToken = res.body.accessToken;
        });
    });

    it('should fail to register with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@test.com',
          name: 'Another User',
          password: 'password123',
          role: 'AFFILIATE',
        })
        .expect(409);
    });

    it('should fail to register with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'password123',
          role: 'PRODUCER',
        })
        .expect(400);
    });

    it('should fail to register with short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test2@test.com',
          name: 'Test User',
          password: '123',
          role: 'PRODUCER',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('newuser@test.com');
        });
    });

    it('should fail to login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'newuser@test.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail to login with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('role');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail to get profile without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should fail to get profile with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
