import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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

  constructor(
    private tobService: TobService,
    private _router: Router ) {
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

      // build queryParam for topic, if specified
      let topicParam = '';
      if (this.selectedTopic) {
        topicParam = `topic=${this.selectedTopic}&`;
      }

      const url = `/demo?${topicParam}name=${this.selectedCred.schema.name}&version=${this.selectedCred.schema.version}&did=${this.selectedCred.schema.origin_did}`;

      this._router.navigateByUrl(url);
    }
  }
}
