import { Component, OnInit, isDevMode } from '@angular/core';
import { Step } from 'src/app/models/step';

@Component({
  selector: 'app-workflow-step',
  templateUrl: './workflow-step.component.html',
  styleUrls: ['./workflow-step.component.scss']
})
export class WorkflowStepComponent implements OnInit {

  step: Step;
  allDepsSatisfied = false;
  isStart = false;
  obtainedCert = false;

  actionURL: string;

  constructor() {  }

  ngOnInit() {
    // generate component state variables
    if (this.step.dependencies.length > 0) {
      this.allDepsSatisfied = this.step.dependencies.map((item) => {
        return item.isAvailable;
      }).reduce((acc, cur) => {
        return acc && cur;
      });
    } else {
      this.isStart = true;
    }

    this.obtainedCert = this.step.credentialId ? true : false;

    // prepare actionURL
    if (this.obtainedCert) {
      this.actionURL = `/topic/${this.step.topicId}/cred/${this.step.credentialId}`;
    } else if (this.isStart || this.allDepsSatisfied) {
      const credentialParam = `credential_ids=${this.step.walletId}`;
      const schemaParam = `schema_name=${this.step.requestedSchema.name}&schema_version=${this.step.requestedSchema.version}&issuer_did=${this.step.requestedSchema.did}`;
      const issuer_endpoint = `issuer_endpoint=${this.step.endpoint}`;
      this.actionURL = `${this.step.actionURL}?${credentialParam}&${schemaParam}&${issuer_endpoint}`;
    } else {
      this.actionURL = null;
    }
  }

}
