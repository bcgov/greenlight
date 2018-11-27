import { TestBed } from '@angular/core/testing';

import { WorkflowNodeResolverService } from './workflow-node-resolver.service';

describe('WorkflowNodeResolverService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorkflowNodeResolverService = TestBed.get(WorkflowNodeResolverService);
    expect(service).toBeTruthy();
  });
});
