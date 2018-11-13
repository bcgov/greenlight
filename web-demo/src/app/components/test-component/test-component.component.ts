import { Component, OnInit, ViewChild, AfterViewInit, Injectable } from '@angular/core';

import { WorkflowNode } from '../../models/workflow-node';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowService } from '../../services/workflow-service.service';

@Component({
  selector: 'app-test-component',
  templateUrl: './test-component.component.html',
  styleUrls: ['./test-component.component.scss']
})

@Injectable()
export class TestComponentComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasRoot') svgRoot;

  constructor(private workflowService: WorkflowService) {
  }

  ngOnInit() {
    const bcreg = new WorkflowNode(1, '<h1>START</h1><p>BC Registries Business Incorporation</p>', 'html');
    this.workflowService.addNode(bcreg);

    const mofi = new WorkflowNode(2, 'BC Provincial Sales Tax Number');
    this.workflowService.addNode(mofi);

    const worksafe = new WorkflowNode(3, 'Worksafe BC Clearance Letter');
    this.workflowService.addNode(worksafe);

    const fraser_health = new WorkflowNode(4, 'Fraser Valley Health Operating Permit');
    this.workflowService.addNode(fraser_health);

    const liquor = new WorkflowNode(5, 'BC Liquor License');
    this.workflowService.addNode(liquor);

    const surrey = new WorkflowNode(6, '<h1>END</h1><p>City of Surrey Business License</p>', 'html');
    this.workflowService.addNode(surrey);

    const somethingelse = new WorkflowNode(7, 'Something Else');
    this.workflowService.addNode(somethingelse);

    const vipnode = new WorkflowNode(8, 'VIP Node');
    this.workflowService.addNode(vipnode);

    const annoyance = new WorkflowNode(9, 'Annoyance');
    this.workflowService.addNode(annoyance);

    // build topology - links
    this.workflowService.addLink(new WorkflowLink(1, 2));
    this.workflowService.addLink(new WorkflowLink(1, 3));
    this.workflowService.addLink(new WorkflowLink(2, 5));
    this.workflowService.addLink(new WorkflowLink(3, 4));
    this.workflowService.addLink(new WorkflowLink(4, 5));
    this.workflowService.addLink(new WorkflowLink(5, 6));
    this.workflowService.addLink(new WorkflowLink(8, 7));
    this.workflowService.addLink(new WorkflowLink(7, 6));
    this.workflowService.addLink(new WorkflowLink(9, 4));

  }

  ngAfterViewInit() {
    this.workflowService.renderGraph(this.svgRoot);
  }

}
