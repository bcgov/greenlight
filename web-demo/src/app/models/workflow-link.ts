export class WorkflowLink {
  public srcNodeId: any;
  public destNodeId: any;

  constructor(srcNodeId: any, destNodeId: any) {
    this.srcNodeId = srcNodeId;
    this.destNodeId = destNodeId;
  }
}
