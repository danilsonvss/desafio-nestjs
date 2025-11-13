import { Test, TestingModule } from '@nestjs/testing';
import { AffiliatesService } from './affiliates.service';

describe('AffiliatesService', () => {
  let service: AffiliatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AffiliatesService],
    }).compile();

    service = module.get<AffiliatesService>(AffiliatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
