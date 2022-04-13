import { TestBed } from '@angular/core/testing';

import { GraveyardDataService } from './graveyard-data.service';

describe('GraveyardDataService', () => {
  let service: GraveyardDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraveyardDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
