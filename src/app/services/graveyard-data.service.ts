import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { Observable } from 'rxjs';
import { Graveyard } from '../types/graveyard';

@Injectable({
  providedIn: 'root'
})
export class GraveyardDataService {

  baseURL = 'https://wipperfuerth.pgconnect.de/api/v1/webgis'

  constructor(private http: HttpClient) { }
  
  AllGraveyards(): Observable<Graveyard[]> {
    return this.http.get<Graveyard[]>(this.baseURL + '/friedhof')
  }
  
  AllAvailableGraveyards(friedhofId: string) {
    let url = this.baseURL + '/grab'
    if (friedhofId != null) {
      url += '?friedhofId='+friedhofId
    }
    return this.http.get<FeatureCollection>(url)
  }

  AllAvailableGravePlots(friedhofId: string) {
    let url = this.baseURL + '/grabstelle'
    if (friedhofId != null) {
      url += '?friedhofId='+friedhofId
    }
    return this.http.get<FeatureCollection>(url)
  }

  AllunassignedGravePlots() {
    return this.http.get<FeatureCollection>(this.baseURL + '/grabstelle/unverknuepft')
  }

}
