import { Issuer } from './issuer';

export class Step {
  // mandatory
  name: string;
  dependencies: Array<StepDependency>;

  // optional
  issuer: Issuer;
  effectiveDate: string;

  // computed
  actionText: string;
  actionURL: string;

  constructor (
    name: string,
    dependencies: Array<StepDependency>,
    issuer?: Issuer,
    effectiveDate?: string
    ) {
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
