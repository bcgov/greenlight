import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Issuer } from '../models/issuer';
import { StepDependency } from '../models/step';

@Injectable({
  providedIn: 'root'
})
export class TobService {

  constructor(private http: HttpClient) { }

  /**
   * Returns the path - described as step and dependencies - to a step.
   */
  getPathToStep () {
    // TODO: make actual service call, based on input parameter rather than hard-coded data
    const reqURL = '/assets/data/topology.json';
    return this.http.get(reqURL);
  }

  /**
   * Queries ToB and returns a list of @Issuer entities that are currently registered.
   */
  getIssuers () {
    // const reqURL = '/bc-tob/issuer';
    const reqURL = '/assets/data/issuers.json';
    // TODO: use types if possible
    return this.http.get(reqURL);
  }

  /**
   * Returns a JSON structure representing the requested topic (e.g.: Incorporated Company)
   * @param topicId the id of the topic being requested
   */
  getTopicById (topicId: number) {
    const reqURL = `/bc-tob/topic/${topicId}/formatted`;
    // TODO: use types if possible
    return this.http.get(reqURL);
  }

  /**
   * Returns a JSON structure representing the list of steps obtained by the topic (e.g.: Incorporated Company)
   * @param topicId the id of the topic being requested
   */
  getStepsByTopic (topicId: number) {
    const reqURL = `/bc-tob/topic/${topicId}/step/active`;
    // TODO: use types if possible
    return this.http.get(reqURL);
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
   * Returns the list of @StepDependency for teh specified id.
   * @param id the id of the step being processed.
   * @param links the data structure representing the topology links.
   */
  getDependenciesByID (id: string, links: any) {
    const deps = links.filter((link) => {
      return link.source === id;
    });
    return deps.map((dep) => {
      return new StepDependency(dep.source);
    });
  }
}
