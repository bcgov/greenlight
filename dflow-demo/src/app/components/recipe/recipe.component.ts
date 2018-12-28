import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { from, Observable } from 'rxjs';
import { combineAll, delay, retry, tap, catchError } from 'rxjs/operators';
import { Issuer } from 'src/app/models/issuer';
import { WorkflowLink } from 'src/app/models/workflow-link';
import { WorkflowNodeResolverService } from 'src/app/services/workflow-node-resolver.service';
import { WorkflowService } from 'src/app/services/workflow.service';
import { Step, StepDependency } from '../../models/step';
import { NodeLabelType, WorkflowNode } from '../../models/workflow-node';
import { AlertService } from '../../services/alert.service';
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

  observables: Array<Observable<any>>;

  progressMsg: string;
  progressQty: number;

  constructor(
    private alertService: AlertService,
    private activatedRoute: ActivatedRoute,
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
      this.observables = [
        this.tobService.getIssuers(),
        this.tobService.getCredentialTypes(),
        this.tobService.getCredentialsByTopic(this.topic),
        this.tobService.getPathToStep(this.targetName, this.targetVersion, this.targetDid).pipe(retry(2))
      ];
    });
  }

  ngAfterViewInit() {
    // Prepare the graph and render once all the data is available
    from(this.observables)
      .pipe(
        delay(200), // allow the progress bar to animate nicely
        tap((observable: Observable<any>) => {
          switch (observable) {
            case this.observables[0]:
              this.setProgress(this.progressQty + 25, 'Retrieved Issuers');
              break;
            case this.observables[1]:
              this.setProgress(this.progressQty + 25, 'Obtained Credential Types');
              break;
            case this.observables[2]:
              this.setProgress(this.progressQty + 25, 'Acquired Credentials');
              break;
            case this.observables[3]:
              this.setProgress(this.progressQty + 25, 'Mapped Topology');
              break;
            default:
              console.log('Unknown observable: ', observable);
          }
        }),
        catchError((error: any) => {
          this.alertService.error('An error has occurred, please try again.');
        }),
        combineAll()
      )
      .subscribe((response: any) => {
        const issuers = response[0].results.map(item => {
          return new Issuer(item);
        });
        const credentialTypes = response[1];
        const credentials = response[2];
        const nodes = response[3].result.nodes;
        const links = response[3].result.links;

        // add nodes
        nodes.forEach((node: any) => {
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
        links.forEach((link: any) => {
          this.workflowService.addLink(new WorkflowLink(link.target, link.source));
        });

        // hide progress-bar and show graph
        this.setProgress(100, 'Rendering Graph');
        setTimeout(() => {
          this.loading = false;
          this.workflowService.renderGraph(this.svgRoot);
        }, 500);
      });
  }

  /**
   * Updates the current progress status, displayed in the progress bar.
   * @param progress the current progress
   * @param message the prograss status message
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
