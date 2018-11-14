import { Component, OnInit } from '@angular/core';
import { Credential, CredentialIssuer } from 'src/app/models/credential';

@Component({
  selector: 'app-workflow-step',
  templateUrl: './workflow-step.component.html',
  styleUrls: ['./workflow-step.component.scss']
})
export class WorkflowStepComponent implements OnInit {

  stepClass: any;
  credential: Credential;

  constructor() {
    this.credential = new Credential();
  }

  ngOnInit() {
    this.stepClass = {};
    this.stepClass['card-default'] = true;
    this.stepClass['card-warning'] = false;
    this.stepClass['card-success'] = false;
    this.stepClass['card-danger'] = false;

    this.credential.name = 'Emiliano';
    this.credential.effectiveDate = '2018-11-13';
    this.credential.actionText = 'View Record';

    // this.credential.issuer = new CredentialIssuer();
    // this.credential.issuer.url = 'www.google.com';
    // this.credential.issuer.name = 'Quartech';

    this.credential.dependencies = new Array<any>();
    this.credential.dependencies.push({
      name: 'Italy',
      isAvailable: true
    });
    this.credential.dependencies.push({
      name: 'Canada',
      isAvailable: false
    });
  }

}
