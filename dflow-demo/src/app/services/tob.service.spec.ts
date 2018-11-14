import { TestBed } from '@angular/core/testing';

import { TobService } from './tob.service';

describe('TobService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TobService = TestBed.get(TobService);
    expect(service).toBeTruthy();
  });
});
