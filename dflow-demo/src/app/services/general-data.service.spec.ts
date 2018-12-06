import { TestBed } from '@angular/core/testing';

import { GeneralDataService } from './general-data.service';

describe('GeneralDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GeneralDataService = TestBed.get(GeneralDataService);
    expect(service).toBeTruthy();
  });
});
