import { Component, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { TobService } from '../../services/tob.service';
import { Schema } from '../../models/schema';
import { Issuer } from 'src/app/models/issuer';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  availableCreds: Array<any>;
  selectedCred: any;

  constructor( private tobService: TobService ) {
    this.availableCreds = new Array<any>();
   }

  ngOnInit() {
    const getIssuers = this.tobService.getIssuers();
    const getSchemas = this.tobService.getLatestSchemas();

    forkJoin(getIssuers, getSchemas).subscribe((data) => {
      const issuers = data[0] as any;
      const schemas = data[1] as any;

      schemas.results.forEach(schema => {
        const schema_obj = new Schema(schema);
        const schemaIssuer = issuers.results.filter((issuer) => {
          const issuer_obj = new Issuer(issuer);
          return schema_obj.origin_did === issuer.did;
        });
        this.availableCreds.push({
          issuer: schemaIssuer[0],
          schema: schema_obj
        });
      });

      console.log(this.availableCreds);
    });
  }

  doSomething() {
    console.log(this.selectedCred.schema.name);
  }
}
