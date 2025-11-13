import { Test, TestingModule } from '@nestjs/testing';
import { TaxesController } from './taxes.controller';
import { TaxesService } from './taxes.service';

const mockTaxesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByCountry: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('TaxesController', () => {
  let controller: TaxesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaxesController],
      providers: [
        { provide: TaxesService, useValue: mockTaxesService },
      ],
    }).compile();

    controller = module.get<TaxesController>(TaxesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
