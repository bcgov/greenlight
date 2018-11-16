import { Issuer } from './issuer';

export class Step {
  // mandatory
  topicId: number;
  name: string;
  dependencies: Array<StepDependency>;

  // optional
  issuer: Issuer;
  effectiveDate: string;

  // computed
  actionText: string;
  actionURL: string;

  constructor (
    topicId: number,
    name: string,
    dependencies: Array<StepDependency>,
    issuer?: Issuer,
    effectiveDate?: string
    ) {
      this.topicId = topicId;
      this.name = name;
      this.dependencies = dependencies;
      this.issuer = issuer;
      this.effectiveDate = effectiveDate;
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
