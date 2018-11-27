import { Injectable, ComponentFactoryResolver, Injector } from '@angular/core';

import { Issuer } from '../models/issuer';
import { WorkflowStepComponent } from '../components/workflow/workflow-step/workflow-step.component';
import { Step } from '../models/step';

@Injectable({
  providedIn: 'root'
})
export class WorkflowNodeResolverService {

  constructor(
    private _resolver: ComponentFactoryResolver,
    private _injector: Injector) { }

  getHTMLForNode(step: Step) {
    const factory = this._resolver.resolveComponentFactory(WorkflowStepComponent);
    const component = factory.create(this._injector);
    component.instance.step = step;
    component.changeDetectorRef.detectChanges();
    const htmlContent = component.location.nativeElement.outerHTML;
    component.destroy();
    return htmlContent;
  }
}
