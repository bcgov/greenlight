import { Injectable, ComponentFactoryResolver, Injector } from '@angular/core';
import { WorkflowNode } from '../models/workflow-node';
import { WorkflowStepComponent } from '../components/workflow/workflow-step/workflow-step.component';

@Injectable({
  providedIn: 'root'
})
export class WorkflowNodeResolverService {

  constructor(
    private _resolver: ComponentFactoryResolver,
    private _injector: Injector) { }

  getHTMLForNode(node: WorkflowNode) {
    const factory = this._resolver.resolveComponentFactory(WorkflowStepComponent);
    const component = factory.create(this._injector);
    // component.instance.label = node.label;
    component.changeDetectorRef.detectChanges();
    const htmlContent = component.location.nativeElement.outerHTML;
    component.destroy();
    return htmlContent;
  }
}
