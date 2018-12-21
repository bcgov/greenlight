import { AfterViewInit, Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { Observable } from 'rxjs/Observable';
import { Issuer } from 'src/app/models/issuer';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowNodeResolverService } from 'src/app/services/workflow-node-resolver.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { Step, StepDependency } from '../../models/step';
import { NodeLabelType, WorkflowNode } from '../../models/workflow-node';
import { TobService } from '../../services/tob.service';
import { ProgressBarComponent } from '../util/progress-bar/progress-bar.component';

@Component({
  selector: 'app-recipe',
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.scss']
})
export class RecipeComponent implements OnInit, AfterViewInit {
  @ViewChild('svgCanvas') svgRoot;
  @ViewChild(ProgressBarComponent) progressBar: ProgressBarComponent;

  loading: boolean;

  topic: number;
  targetName: string;
  targetVersion: string;
  targetDid: string;

  issuers: Observable;
  topology: Observable;
  credentials: Observable;
  credentialTypes: Observable;

  progressMsg: string;
  progressQty: number;

  constructor(
    private activatedRoute: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private workflowService: WorkflowService,
    private nodeResolverService: WorkflowNodeResolverService,
    private tobService: TobService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.setProgress(0, 'Initializing');

    this.activatedRoute.queryParams.subscribe(params => {
      this.targetName = params['name'];
      this.targetVersion = params['version'];
      this.targetDid = params['did'];
      this.topic = params['topic'];

      // TODO: handle missing query params, maybe display alert error

      // start request for observables
      this.issuers = this.tobService.getIssuers();
      this.topology = this.tobService.getPathToStep(this.targetName, this.targetVersion, this.targetDid);
      this.credentialTypes = this.tobService.getCredentialTypes();
      if(this.topic){
        this.credentials = this.tobService.getCredentialsByTopic(this.topic);
      } else {
        this.credentials = of(new Array<any>());
      }
    });
  }

  ngAfterViewInit() {
    const issuers = new Array<Issuer>();
    let nodes;
    let links;
    let credentialTypes;
    let credentials;

    // Provide visual feedback as requests complete
    this.issuers.subscribe(issuersRepl => {
      console.log('Issuers: ', issuersRepl);
      issuersRepl.results.forEach(issuer => {
        issuers.push(new Issuer(issuer));
      });
      this.setProgress(this.progressQty + 25, 'Retrieved Issuers');
      this.cdRef.detectChanges();
    });
    this.credentialTypes.subscribe(credTypes => {
      console.log('CredTypes: ', credTypes);
      credentialTypes = credTypes;
      this.setProgress(this.progressQty + 25, 'Obtained Credential Types');
      this.cdRef.detectChanges();
    });
    this.credentials.subscribe(creds => {
      console.log('Credentials: ', creds);
      credentials = creds;
      this.setProgress(this.progressQty + 25, 'Acquired Credentials');
      this.cdRef.detectChanges();
    });
    this.topology.subscribe(topology => {
      console.log('Topology: ', topology);
      nodes = topology.result.nodes;
      links = topology.result.links;
      this.setProgress(this.progressQty + 25, 'Mapping Topology');
      this.cdRef.detectChanges();
    });

    // Prepare the graph and render once all the data is available
    forkJoin(this.issuers, this.credentialTypes, this.credentials, this.topology).subscribe(() => {
      // add nodes
      nodes.forEach(node => {
        const issuer = this.tobService.getIssuerByDID(node.origin_did, issuers);
        const deps = this.tobService.getDependenciesByID(node.id, links, credentials, issuers);
        const walletId = this.getWalletId(deps, credentials);
        const credData = this.availableCredForIssuerAndSchema(issuer, node.schema_name, credentials);
        const schemaURL = this.getCredentialActionURL(node.schema_name, credentialTypes);
        const step = new Step({
          topicId: this.topic,
          walletId: walletId,
          stepName: node.schema_name,
          dependencies: deps,
          issuer: issuer,
          credData: credData,
          schema: {
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
      links.forEach(link => {
        this.workflowService.addLink(new WorkflowLink(link.target, link.source));
      });

      // hide progress-bar and show graph
      this.setProgress(100, 'Rendering dFlow');
      setTimeout(() => {
        this.loading = false;
        this.workflowService.renderGraph(this.svgRoot);
      }, 500);
    });
  }

  /**
   * Updates the current progress status, displayed in the progress bar.
   */
  setProgress(progress: number, message?: string) {
    this.progressQty = progress;
    this.progressMsg = message;
  }

  /**
   * Returns the credential issued by the specified issuer, if available.
   * @param issuer the issuer issuing the credential.
   */
  private availableCredForIssuerAndSchema(issuer: Issuer, schemaName: string, credentials: any) {
    let result;
    credentials.forEach(cred => {
      if (cred.credential_type.issuer.did === issuer.did && cred.credential_type.schema.name === schemaName) {
        result = {
          id: cred.id,
          effective_date: cred.effective_date
        };
      }
    });
    return result;
  }

  private getWalletId(deps: Array<StepDependency>, credentials: any) {
    let walletId = new Array<string>();
    if (credentials && credentials.length > 0 && deps) {
      // TODO: fix dependency handling to only use what is necessary
      /*
       * This is the right way of handling things, however the dflow agents use a
       * list of proofs and "depends_on" clauses that doesn't match (to make the graph interesting)
       */
      // deps.forEach(dependency => {
      // const availableCred = this.credentials.find((cred) => {
      //   return cred.credential_type.schema.name === dependency.schema;
      // });
      // if (availableCred) {
      //   walletId.push(availableCred.wallet_id);
      // }
      // });
      credentials.forEach(cred => {
        walletId.push(cred.wallet_id);
      });
    }
    return walletId.join(',');
  }

  private getCredentialActionURL(schemaName: string, credentialTypes: any) {
    const credType = credentialTypes.results.find(credType => {
      return credType.schema.name === schemaName;
    });
    if (!credType) {
      console.log(`Could not find any credential type matching schema ${schemaName}`);
    }
    return credType.url || '';
  }
}
