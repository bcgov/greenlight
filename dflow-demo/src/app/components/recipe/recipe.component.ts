import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { WorkflowService } from 'src/app/services/workflow.service';
import { WorkflowNode, NodeLabelType } from '../../models/workflow-node';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowNodeResolverService } from 'src/app/services/workflow-node-resolver.service';
import { TobService } from '../../services/tob.service';
import { Issuer } from 'src/app/models/issuer';
import { Step } from '../../models/step';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasRoot') svgRoot;
  issuers: Array<Issuer>;
  graphLayout: Promise<any>;

  constructor(
    private workflowService: WorkflowService,
    private nodeResolverService: WorkflowNodeResolverService,
    private tobService: TobService) {
      this.issuers = new Array<Issuer>();
    }

  ngOnInit() {
    // get issuer list
    this.graphLayout = this.tobService.getIssuers().toPromise()
    .then((data: any) => {
      data.results.forEach(element => {
        this.issuers.push(new Issuer(element));
      });
    }).then(() => {
      // get topology and set-up graphing library
      return this.tobService.getPathToStep().toPromise().then((result: any) => {
        // add nodes
        result.nodes.forEach(node => {
          const issuer = this.tobService.getIssuerByDID(node.origin_did, this.issuers);
          const deps = this.tobService.getDependenciesByID(node.id, result.links);
          const cred = new Step(node.schema_name, deps, issuer);
          const nodeHTML = this.nodeResolverService.getHTMLForNode(cred);
          this.workflowService.addNode(new WorkflowNode(node.id, nodeHTML, NodeLabelType.HTML));
        });

        // add links
        result.links.forEach(link => {
          this.workflowService.addLink(new WorkflowLink(link.target, link.source));
        });
      });
    });
  }

  ngAfterViewInit() {
    // render graph
    this.graphLayout.then(() => {
      this.workflowService.renderGraph(this.svgRoot);
    });
  }

}
