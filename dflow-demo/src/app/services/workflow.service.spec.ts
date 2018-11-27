import { TestBed } from '@angular/core/testing';

import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorkflowService = TestBed.get(WorkflowService);
    expect(service).toBeTruthy();
  });
});
