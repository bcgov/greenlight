import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { map, reduce, mergeMap, mergeAll, combineAll, concatAll, concatMap, exhaustMap, switchMap } from 'rxjs/operators';
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

  recordCache = {};

  constructor(
    private tobService: TobService,
    private _router: Router ) {
    this.availableCreds = new Array<any>();
   }

  ngOnInit() {
    const getIssuers = this.getIssuers();
    const getSchemas = this.getSchemas();

    forkJoin(getIssuers, getSchemas).subscribe((data: any) => {
      console.log('DATA:', data);
      const issuers = data[0] as any;
      const schemas = data[1] as any;

      this.updateCredentialList(issuers, schemas);
    });
  }

  updateCredentialList(issuers: any, schemas: any) {
    schemas.forEach(schema => {
      const schema_obj = new Schema(schema);
      const schemaIssuer = issuers.filter((issuer) => {
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
      if ( displayA < displayB ) {
          return -1
      }
      if ( displayA > displayB ) {
          return 1
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

      // build queryParam for topic, if specified
      let topicParam = '';
      if (this.selectedTopic) {
        topicParam = `topic=${this.selectedTopic}&`;
      }

      const url = `/demo?${topicParam}name=${this.selectedCred.schema.name}&version=${this.selectedCred.schema.version}&did=${this.selectedCred.schema.origin_did}`;

      this._router.navigateByUrl(url);
    }
  }

  /**
   * Load records from a paginated API endpoint, recursively following new pages until all data has been fetched.
   * @param url the URL to query
   * @param cache whether to enable cache
   * @param prevLoad the result of the previous call in the stack, if acting recursively
   */
  loadRecordList(url: string, cache?: boolean, prevLoad?: any): Observable<any> {
    if(cache && this.recordCache[url]){
      return this.recordCache[url];
    }
    let pageNum = prevLoad ? prevLoad.page + 1 : 1;
    let results = prevLoad ? prevLoad.results : new Array<any>();
    return this.tobService
      .getPaginatedUrl(url, pageNum)
      .pipe(
        map((response: any) => {
          results = results.concat(response["results"]);
          if(response["last_index"] < response["total"]) {
            return this.loadRecordList(url, cache, {page: pageNum, results: results});
          }
          if(cache){
            this.recordCache[url] = results;
          }
          return of(results);
        }),
        switchMap((val) => {
          // return the last value emitted by the observable, which will contain all of the data
          return val;
        }));
  }

  getIssuers(): Observable<any> {
    return this.loadRecordList('/bc-tob/issuer', true);
  }

  getSchemas(): Observable<any> {
    return this.loadRecordList('/bc-tob/schema', true);
  }

}
