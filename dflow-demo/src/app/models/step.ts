import { Issuer } from './issuer';

export class Step {
  // mandatory
  topicId: number;
  name: string;
  dependencies: Array<StepDependency>;

  // optional
  issuer: Issuer;
  effectiveDate: string;
  credentialId: number;
  walletId: string;

  // computed
  actionText: string;
  actionURL: string;

  constructor (
    topicId: number,
    walletId: string,
    name: string,
    dependencies: Array<StepDependency>,
    issuer?: Issuer,
    credData?: any
    ) {
      this.topicId = topicId;
      this.walletId = walletId;
      this.name = name;
      this.dependencies = dependencies;
      this.issuer = issuer;
      if (credData) {
        this.credentialId = credData.id;
        this.effectiveDate = credData.effective_date;
      }
    }
}

export class StepDependency {
  name: string;
  isAvailable: boolean;

  constructor (name: string, isAvailable = false) {
    this.name = name;
    this.isAvailable = isAvailable;
  }
}
