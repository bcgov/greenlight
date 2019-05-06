export class Issuer {
  id: number;
  has_logo: boolean;
  create_timestamp: string;
  update_timestamp: string;
  did: string;
  name: string;
  abbreviation: string;
  email: string;
  url: string;

  constructor (issuer: any) {
    this.id = issuer.id || 0;
    this.has_logo = issuer.has_log || false;
    this.create_timestamp = issuer.create_timestamp || '';
    this.update_timestamp = issuer.update_timestamp || '';
    this.did = issuer.did || '';
    this.name = issuer.name || '';
    this.abbreviation = issuer.abbreviation || '';
    this.email = issuer.email || '';
    this.url = issuer.url || '';
  }

}
