import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkflowStepComponent } from './workflow-step.component';

describe('WorkflowStepComponent', () => {
  let component: WorkflowStepComponent;
  let fixture: ComponentFixture<WorkflowStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkflowStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkflowStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
