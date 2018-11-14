export class Credential {
  name: string;
  effectiveDate: string;
  actionText: string;
  issuer: CredentialIssuer;
  dependencies: Array<CredentialDependency>;

  constructor () {
    this.dependencies = new Array<CredentialDependency>();
  }
}

export class CredentialIssuer {
  name: string;
  url: string;
}

export class CredentialDependency {
  name: string;
  isAvailable: boolean;
}
