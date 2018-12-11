import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Issuer } from 'src/app/models/issuer';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowNodeResolverService } from 'src/app/services/workflow-node-resolver.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { Step, StepDependency } from '../../models/step';
import { NodeLabelType, WorkflowNode } from '../../models/workflow-node';
import { TobService } from '../../services/tob.service';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, AfterViewInit {

  @ViewChild('canvasRoot') svgRoot;

  progress: number;
  progressMsg: string;

  topic: number;
  targetName: string;
  targetVersion: string;
  targetDid: string;

  issuers: Array<Issuer>;
  nodes: any;
  links: any;

  credentials: any;
  credentialTypes: any;
  graphLayout: Promise<any>;

  constructor(
    private activatedRoute: ActivatedRoute,
    private workflowService: WorkflowService,
    private nodeResolverService: WorkflowNodeResolverService,
    private tobService: TobService) {
      this.setProgress(15, 'Loading steps...');
      this.issuers = new Array<Issuer>();
    }

  ngOnInit() {
    // get topicId from route
    this.activatedRoute.queryParams.subscribe((params) => {
      this.targetName = params['name'];
      this.targetVersion = params['version'];
      this.targetDid = params['did'];

      this.topic = params['topic'];

      this.setProgress(50, 'Loading steps...'); // this value is arbitrary, it just provides visual feedback for the user
      console.log(this.progress);

      this.graphLayout = this.tobService.getIssuers().toPromise()
      .then((issuers: any) => {
        console.log('Issuers:', issuers);
        this.setProgress(70, 'Retrieving issuer data...'); // this value is arbitrary, it just provides visual feedback for the user

        issuers.results.forEach(issuer => {
          this.issuers.push(new Issuer(issuer));
        });
      }).then(() => {
        // get topology and set-up graphing library
        return this.tobService.getPathToStep(this.targetName, this.targetVersion, this.targetDid).toPromise();
      }).then((topology: any) => {
        console.log('Path:', topology);
        this.setProgress(80, 'Generating graph...'); // this value is arbitrary, it just provides visual feedback for the user

        // store topology
        this.nodes = topology.result.nodes;
        this.links = topology.result.links;
      }).then(() => {
        this.setProgress(90, 'Processing credentials...'); // this value is arbitrary, it just provides visual feedback for the user
        // grab credential types, to decode the credential-specific issuer URL for each credential
        return this.tobService.getCredentialTypes().toPromise();
      })
      .then((credTypes: any) => {
        this.credentialTypes = credTypes;

        this.setProgress(95, 'Processing credentials...'); // this value is arbitrary, it just provides visual feedback for the user
        return new Promise<any>((resolve) => {
          setTimeout(() => {
            // grab the credentials if we already have a topic, otherwise return an empty array
            if (this.topic) {
              resolve(this.tobService.getCredentialsByTopic(this.topic).toPromise());
            } else {
              resolve(new Array<any>());
            }
          }, 1000);
        });
      })
      .then((creds: any) => {
        this.setProgress(99, 'Processing credentials...'); // this value is arbitrary, it just provides visual feedback for the user

        console.log('Credentials:', creds);
        this.credentials = creds;

        // add nodes
        this.nodes.forEach(node => {
          const issuer = this.tobService.getIssuerByDID(node.origin_did, this.issuers);
          const deps = this.tobService.getDependenciesByID(node.id, this.links, this.credentials, this.issuers);
          const walletId = this.getWalletId(deps);
          const credData = this.availableCredForIssuerAndSchema(issuer, node.schema_name);
          const schemaURL = this.getCredentialActionURL(node.schema_name);
          const step = new Step({
            topicId: this.topic,
            walletId: walletId,
            stepName: node.schema_name,
            dependencies: deps,
            issuer: issuer,
            credData: credData,
            schema : {
              name: this.targetName,
              version: this.targetVersion,
              did: this.targetDid
            },
            schemaURL: schemaURL
          });
          const nodeHTML = this.nodeResolverService.getHTMLForNode(step);
          this.workflowService.addNode(new WorkflowNode(node.id, nodeHTML, NodeLabelType.HTML));
        });

        // add links
        this.links.forEach(link => {
          this.workflowService.addLink(new WorkflowLink(link.target, link.source));
        });
      });
    })
  }

  ngAfterViewInit() {
    // render graph
    this.graphLayout.then(() => {
      // hide progress-bar and show graph
      this.setProgress(100, 'dFlow loaded!'); // this value is arbitrary, it just provides visual feedback for the user

      this.workflowService.renderGraph(this.svgRoot);
    });
  }

  /**
   * Returns the credential issued by the specified issuer, if available.
   * @param issuer the issuer issuing the credential.
   */
  private availableCredForIssuerAndSchema (issuer: Issuer, schemaName: string) {
    let result;
    this.credentials.forEach(cred => {
      if (cred.credential_type.issuer.did === issuer.did
          && cred.credential_type.schema.name === schemaName) {
        result = {
          id: cred.id,
          effective_date: cred.effective_date
        };
      }
    });
    return result;
  }

  private getWalletId(deps: Array<StepDependency>) {
    let walletId = new Array<string>();
    if (this.credentials && this.credentials.length > 0 && deps) {
      deps.forEach(dependency => {
        const availableCred = this.credentials.find((cred) => {
          return cred.credential_type.schema.name === dependency.schema;
        });
        if (availableCred) {
          walletId.push(availableCred.wallet_id);
        }
      });
    }
    return walletId.join(',');
  }

  private setProgress (progress: number, progressMsg: string) {
    this.progress = progress;
    this.progressMsg = progressMsg;
  }

  private getCredentialActionURL (schemaName: string) {
    const credType = this.credentialTypes.results.find((credType) => {
      return credType.schema.name === schemaName;
    });
    return credType.url;
  }

}
