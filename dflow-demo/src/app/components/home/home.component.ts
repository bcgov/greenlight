import { Component, OnInit } from '@angular/core';

import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

import { TobService } from '../../services/tob.service';
import { Schema } from '../../models/schema';
import { Issuer } from 'src/app/models/issuer';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  availableCreds: Array<any>;
  selectedCred: any;
  error = false;

  constructor(
    private tobService: TobService,
    private router: Router ) {
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

      // TODO: sort array in-place for now. A pipe will be better once dFlow is refactored.
      this.availableCreds.sort((a, b) => {
        const displayA = `${a.issuer.name} - ${a.schema.name}`;
        const displayB = `${b.issuer.name} - ${b.schema.name}`;
        if ( displayA < displayB ) {
            return -1
        }
        if ( displayA > displayB ) {
            return 1
        }
        return 0;
      });

      console.log(this.availableCreds);
    });
  }

  begin() {
    if (!this.selectedCred) {
      // don't proceed if a credential is not selected
      this.error = true;
    } else {
      this.error = false;

      const url = `/demo?name=${this.selectedCred.schema.name}&version=${this.selectedCred.schema.version}&did=${this.selectedCred.schema.origin_did}`;

      this.router.navigateByUrl(url);
    }
  }
}
