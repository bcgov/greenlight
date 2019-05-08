import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Issuer } from '../models/issuer';
import { StepDependency } from '../models/step';

@Injectable({
  providedIn: 'root'
})
export class TobService {

  recordCache = {};

  constructor(private http: HttpClient) { }

  /**
   * Returns the path - described as step and dependencies - to a step.
   * @param endpojnt The endpoint for the target issuer.
   * @param name The name of the shema being looked up.
   * @param version The version of the schema being looked up.
   * @param did The did of the issuer issuing the specified schema.
   */
  getPathToStep (endpoint: string, name: string, version: string, did: string) {
    let reqURL = '';

    // This is required to address limitations with how the agent endpoints are published in Docker
    // if (/^http(s?):\/\/localhost/.test(window.location.href)) {
      reqURL = `bcreg/get-credential-dependencies?schema_name=${name}&schema_version=${version}&origin_did=${did}`;
    // } else {
    //   reqURL = `${endpoint}/get-credential-dependencies?schema_name=${name}&schema_version=${version}&origin_did=${did}`;
    // }
    return this.http.post(reqURL, null, { withCredentials: true });
  }

  /**
   * Queries ToB and returns a list of @Issuer entities that are currently registered.
   */
  getIssuers () {
    return this.loadRecordList('/bc-tob/issuer');
  }

  /**
   * Queries ToB and returns the list of @Schema objects that are currently registered.
   */
  getSchemas () {
    return this.loadRecordList('/bc-tob/schema');
  }

  /**
   * Returns a JSON structure representing the requested topic (e.g.: Incorporated Company)
   * @param topicId the id of the topic being requested
   */
  getTopicById (topicId: number) {
    const reqURL = `/bc-tob/topic/${topicId}/formatted`;
    // const reqURL = '/assets/data/topic.json';
    // TODO: use types if possible
    return this.http.get(reqURL);
  }

  getPaginatedUrl(url: string, page?: number) {
    // return this.http.get(`${url}?page=${pageNum}`);
    return this.http.get(`${url}?page=${page}`);
  }

  /**
   * Restirns a JSON structure representing the details for the credentials registered in ToB.
   */
  getCredentialTypes() {
    return this.loadRecordList('/bc-tob/credentialtype');
  }

  getCredentialsByTopic (topicId) {
    // TODO: use types if possible
    if (topicId) {
      const reqURL = `/bc-tob/topic/${topicId}/credential/active`;
      // const reqURL = '/assets/data/credentials-by-topic.json';
      return this.http.get(reqURL);
    }
    return of(new Array<any>());
  }

  /**
   * Returns the @Issuer matching the given did. If no issuer matches the DID, it returns null.
   * @param did the did of the issuer
   */
  getIssuerByDID (did: string, issuers: Array<Issuer>) {
    return issuers.find((issuer) => {
      return issuer.did === did;
    });
  }

  /**
   * Returns the list of @StepDependency for the specified id.
   * @param id the id of the step being processed.
   * @param links the data structure representing the topology links.
   * @param creds the available credentials to be processed
   * @param issuers the list of issuers
   */
  getDependenciesByID (id: string, links: any, creds: any, issuers: Array<Issuer>) {
    return links.map((link) => {
      // straighten the tree: it is provided from the point of view of the destination,
      // we want it the other way around
      const newLink = {
        source: link.target,
        target: link.source
      };
      return newLink;
    }).filter((link) => {
      // find dependencies for this step: anywhere the link is a target
      return link.target === id;
    }).map((dep) => {
      // create new dep
      const depIssuer = issuers.find((issuer) => {
        return dep.source.indexOf(issuer.did) > -1
      });
      const isAvailable = this.isCredentialAvailable(dep.source, creds);
      const depSchema = dep.source.split(':')[0]; // ghrab the schema name
      return new StepDependency(depIssuer.name, depSchema, isAvailable);
    });
  }

  /**
   * Returns true if the credential corresponding to the given id if available, false otherwise.
   * @param id the id of the credential to check.
   * @param creds the list of credentials to check.
   */
  private isCredentialAvailable(id: string, creds: any) {
    const result = creds.filter((cred) => {
      return id.indexOf(cred.credential_type.issuer.did) > -1
        && id.indexOf(cred.credential_type.schema.name) > -1;
    });
    return result.length > 0;
  }

  /**
   * Load records from a paginated API endpoint, recursively following new pages until all data has been fetched.
   * @param url the URL to query
   * @param cache whether to enable cache
   * @param prevLoad the result of the previous call in the stack, if acting recursively
   */
  private loadRecordList(url: string, prevLoad?: any): Observable<any> {
    let pageNum = prevLoad ? prevLoad.page + 1 : 1;
    let results = prevLoad ? prevLoad.results : new Array<any>();
    return this.getPaginatedUrl(url, pageNum)
      .pipe(
        map((response: any) => {
          results = results.concat(response['results']);
          if (response['last_index'] < response['total']) {
            return this.loadRecordList(url, { page: pageNum, results: results });
          }
          return of(results);
        }),
        switchMap(val => {
          // return the last value emitted by the observable, which will contain all of the data
          return val;
        })
      );
  }
}
