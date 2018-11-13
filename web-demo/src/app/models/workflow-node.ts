export class WorkflowNode {
  public did: any;
  public label: string;
  public labelType: string;

  constructor(did: any, label: string, labelType?: string) {
    this.did = did;
    this.label = label;
    if (labelType) {
      this.labelType = labelType;
    }
  }
}
