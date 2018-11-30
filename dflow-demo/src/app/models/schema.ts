export class Schema {
  id: number;
  create_timestamp: string;
  update_timestamp: string;
  name: string;
  version: string;
  origin_did: string

  constructor(schema: any) {
    this.id = schema.id;
    this.create_timestamp = schema.create_timestamp;
    this.update_timestamp = schema.update_timestamp;
    this.name = schema.name;
    this.version = schema.version;
    this.origin_did = schema.origin_did;
  }
}
