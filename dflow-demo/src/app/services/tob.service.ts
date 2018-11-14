import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Issuer } from '../models/issuer';

@Injectable({
  providedIn: 'root'
})
export class TobService {

  constructor(private http: HttpClient) { }

  /**
   * Returns the path - described as credential and dependencies - to a credential.
   */
  getPathToCredential () {
    // TODO: make actual service call, based on input parameter rather than hard-coded data
    return [
      // BC Reg
      {
        did: '6qnvgJtqwK44D8LFYnV5Yf',
        credentialName: 'BC Registries Business Incorporation',
        dependencies: []
      },
      // Ministry Finance
      {
        did: 'CYnWiuEtJJuhpWvVz3kY9D',
        credentialName: 'BC Provincial Sales Tax Number',
        dependencies: [
          // BC Reg
          '6qnvgJtqwK44D8LFYnV5Yf'
        ]
      },
      // Worksafe BC
      {
        did: 'MAcounf9HxhgnqqhzReTLC',
        credentialName: 'Worksafe BC Clearance Letter',
        dependencies: [
          // BC Reg
          '6qnvgJtqwK44D8LFYnV5Yf'
        ]
      },
      // Fraser Valley
      {
        did: 'L6SJy7gNRCLUp8dV94hfex',
        credentialName: 'Fraser Valley Health Operating Permit',
        dependencies: [
          // BC Reg
          '6qnvgJtqwK44D8LFYnV5Yf',
          // Worksafe BC
          'MAcounf9HxhgnqqhzReTLC'
        ]
      },
      // Liquor
      {
        did: 'ScrMddP9C426QPrp1KViZB',
        credentialName: 'BC Liquor License',
        dependencies: [
          // BC Reg
          '6qnvgJtqwK44D8LFYnV5Yf',
          // Ministry Finance,
          'CYnWiuEtJJuhpWvVz3kY9D',
          // Worksafe BC
          'MAcounf9HxhgnqqhzReTLC',
          // Fraser Valley
          'L6SJy7gNRCLUp8dV94hfex'
        ]
      },
      // Surrey
      {
        did: 'A9Rsuu7FNquw8Ne2Smu5Nr',
        credentialName: 'City of Surrey Business License',
        dependencies: [
          // BC Reg
          '6qnvgJtqwK44D8LFYnV5Yf',
          // Ministry Finance,
          'CYnWiuEtJJuhpWvVz3kY9D',
          // Worksafe BC
          'MAcounf9HxhgnqqhzReTLC',
          // Fraser Valley
          'L6SJy7gNRCLUp8dV94hfex',
          // Liquor
          'ScrMddP9C426QPrp1KViZB'
        ]
      }
    ];
  }

  /**
   * Queries ToB and returns a list of @Issuer entities that are currently registered.
   */
  getIssuers () {
    const reqURL = '/bc-tob/issuer';
    // TODO: use types if possible
    return this.http.get(reqURL).subscribe((data: any) => {
      const issuers = new Array<Issuer>();
      data.results.forEach(element => {
        issuers.push(new Issuer(element));
      });
      return issuers;
    });
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
   * Returns a JSON structure representing the list of credentials obtained by the topic (e.g.: Incorporated Company)
   * @param topicId the id of the topic being requested
   */
  getCredentialsByTopic (topicId: number) {
    const reqURL = `/bc-tob/topic/${topicId}/credential/active`;
    // TODO: use types if possible
    return this.http.get(reqURL);
  }
}
