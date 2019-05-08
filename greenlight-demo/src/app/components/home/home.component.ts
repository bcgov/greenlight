import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Issuer } from 'src/app/models/issuer';
import { Schema } from '../../models/schema';
import { TobService } from '../../services/tob.service';
import { SearchInputComponent } from '../search/search-input/search-input.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild('searchInput') _searchInput: SearchInputComponent;

  availableCreds: Array<any>;
  selectedCred: any;
  selectedTopic: string;
  error = false;

  constructor(private tobService: TobService, private router: Router) {
    this.availableCreds = new Array<any>();
  }

  ngOnInit() {
    const getIssuers = this.tobService.getIssuers();
    const getSchemas = this.tobService.getSchemas();

    forkJoin(getIssuers, getSchemas).subscribe((data: any) => {
      const issuers = data[0] as any;
      const schemas = data[1] as any;

      this.updateCredentialList(issuers, schemas);
    });
  }

  updateCredentialList(issuers: any, schemas: any) {
    schemas.forEach(schema => {
      const schema_obj = new Schema(schema);
      const schemaIssuer = issuers.filter(issuer => {
        const issuer_obj = new Issuer(issuer);
        return schema_obj.origin_did === issuer_obj.did;
      });
      this.availableCreds.push({
        issuer: schemaIssuer[0],
        schema: schema_obj
      });
    });
    this.availableCreds.sort((a, b) => {
      const displayA = `${a.issuer.name} - ${a.schema.name}`;
      const displayB = `${b.issuer.name} - ${b.schema.name}`;
      if (displayA < displayB) {
        return -1;
      }
      if (displayA > displayB) {
        return 1;
      }
      return 0;
    });
  }

  /**
   * Updated the currently selected topic id, if the search was successful
   * @param evt the event triggered by the typeahead search action
   */
  performSearch(evt?) {
    const selected = this._searchInput.value;
    if (selected && selected.id) {
      this.selectedTopic = selected.id;
    }
  }

  begin() {
    if (!this.selectedCred) {
      // don't proceed if a credential is not selected
      this.error = true;
    } else {
      this.error = false;

      this.router.navigate(['/demo'], { queryParams : {
          topic: this.selectedTopic,
          name: this.selectedCred.schema.name,
          version: this.selectedCred.schema.version,
          did: this.selectedCred.schema.origin_did,
          issuer_endpoint: this.selectedCred.issuer.endpoint
        },
        queryParamsHandling: 'merge'
      });
    }
  }
}
