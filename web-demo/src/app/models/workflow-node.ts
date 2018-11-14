export class WorkflowNode {
  public did: any;
  public label: string;
  public labelType: string;

  constructor(did: any, label: string, labelType?: NodeLabelType) {
    this.did = did;
    this.label = label;
    if (labelType) {
      this.labelType = labelType === NodeLabelType.HTML ? 'html' : undefined;
    }
  }
}

export enum NodeLabelType {
  Plain,
  HTML
}
