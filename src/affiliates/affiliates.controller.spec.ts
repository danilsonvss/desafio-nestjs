import { Test, TestingModule } from '@nestjs/testing';
import { AffiliatesController } from './affiliates.controller';

describe('AffiliatesController', () => {
  let controller: AffiliatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AffiliatesController],
    }).compile();

    controller = module.get<AffiliatesController>(AffiliatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
