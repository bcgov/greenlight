import { WorkflowNode } from './workflow-node';
import { WorkflowLink } from './workflow-link';
export class WorkflowTopology {

  nodes: Array<WorkflowNode>;
  links: Array<WorkflowLink>;

  constructor () {
    this.nodes = new Array<WorkflowNode>();
    this.links = new Array<WorkflowLink>();
  }


  removeFromTopology (item: Object) {
    if (item instanceof WorkflowNode) {
      const index = this.nodes.indexOf(item as WorkflowNode);
      if ( index > -1) {
        this.nodes.splice(index, 1);
      }
    } else if (item instanceof WorkflowLink) {
      const index = this.links.indexOf(item as WorkflowLink);
      if ( index > -1) {
        this.links.splice(index, 1);
      }
    } else {
      throw new Error('The type of the provided object is not supported. It must be WorkflowNode or WorkflowLink');
    }
  }
}
