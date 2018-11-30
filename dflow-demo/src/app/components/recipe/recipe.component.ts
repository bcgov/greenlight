import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Issuer } from 'src/app/models/issuer';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowNodeResolverService } from 'src/app/services/workflow-node-resolver.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { Step } from '../../models/step';
import { NodeLabelType, WorkflowNode } from '../../models/workflow-node';
import { TobService } from '../../services/tob.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasRoot') svgRoot;
  issuers: Array<Issuer>;
  topic: number;
  credentials: any;
  walletId: string;
  graphLayout: Promise<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private workflowService: WorkflowService,
    private nodeResolverService: WorkflowNodeResolverService,
    private tobService: TobService) {
      this.issuers = new Array<Issuer>();
    }

  ngOnInit() {
    // get topicId from route
    this.activatedRoute.queryParams.subscribe((params) => {
      this.topic = params['topic'];
      // create a promise that will be resolved once the graph is ready to be rendered
      // start with retrieving all the credentials that have been issued so far
      this.graphLayout = this.tobService.getCredentialsByTopic(this.topic).toPromise()
      .then((creds) => {
        console.log('Credentials:', creds);
        this.credentials = creds;
        this.walletId = this.getWalletId();
        // get issuer list
        return this.tobService.getIssuers().toPromise();
      }).then((data: any) => {
        console.log('Issuers:', data);
        data.results.forEach(element => {
          this.issuers.push(new Issuer(element));
        });
      }).then(() => {
        // get topology and set-up graphing library
        return this.tobService.getPathToStep("biz_license.permitify", "1.0.4", "A9Rsuu7FNquw8Ne2Smu5Nr").toPromise();
      }).then((result: any) => {
        console.log('Path:', result);
        // add nodes
        result.result.nodes.forEach(node => {
          const issuer = this.tobService.getIssuerByDID(node.origin_did, this.issuers);
          const deps = this.tobService.getDependenciesByID(node.id, result.result.links, this.credentials, this.issuers);
          const credData = this.availableCredForIssuer(issuer);
          const step = new Step(this.topic, this.walletId, node.schema_name, deps, issuer, credData);
          const nodeHTML = this.nodeResolverService.getHTMLForNode(step);
          this.workflowService.addNode(new WorkflowNode(node.id, nodeHTML, NodeLabelType.HTML));
        });

        // add links
        result.result.links.forEach(link => {
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

  /**
   * Returns the credential issued by the specified issuer, if available.
   * @param issuer the issuer issuing the credential.
   */
  private availableCredForIssuer (issuer: Issuer) {
    let result;
    this.credentials.forEach(cred => {
      if (cred.credential_type.issuer.did === issuer.did) {
        result = {
          id: cred.id,
          effective_date: cred.effective_date
        };
      }
    });
    return result;
  }

  private getWalletId() {
    let walletId = undefined;
    if (this.credentials) {
      walletId = this.credentials[0].wallet_id;
    }
    return walletId;
  }

}
