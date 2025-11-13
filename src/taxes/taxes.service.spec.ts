import { Test, TestingModule } from '@nestjs/testing';
import { TaxesService } from './taxes.service';
import { PrismaService } from '../database/prisma.service';

const mockPrismaService = {
  db: {
    taxConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
};

describe('TaxesService', () => {
  let service: TaxesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaxesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaxesService>(TaxesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
