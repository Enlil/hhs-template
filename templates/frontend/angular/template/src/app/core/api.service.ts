import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ExampleResponse {
  message: string;
  receivedAt: string;
}

// Matches shared/contracts/openapi.yaml — both the Node and .NET backends
// return this exact shape.
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getExample(): Observable<ExampleResponse> {
    return this.http.get<ExampleResponse>(`${environment.apiUrl}/example`);
  }
}
