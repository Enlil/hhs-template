import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ApiService, type ExampleResponse } from './api.service';

export type ExampleState =
  | { status: 'loading' }
  | { status: 'success'; data: ExampleResponse }
  | { status: 'error'; message: string };

// Loads GET /api/example when the page is created, and again whenever
// `loadExample()` is called (the Retry button). It holds no markup: the
// dashboard of every CSS framework folder (see ui/ in the template) extends
// this and shows the three states its own way.
export abstract class ExampleLoader {
  private readonly api = inject(ApiService);

  protected apiState: ExampleState = { status: 'loading' };

  constructor() {
    this.loadExample();
  }

  protected loadExample(): void {
    this.apiState = { status: 'loading' };
    this.api.getExample().subscribe({
      next: (data) => (this.apiState = { status: 'success', data }),
      error: (error: unknown) => {
        const message = error instanceof HttpErrorResponse ? error.message : 'Unknown error';
        this.apiState = { status: 'error', message };
      },
    });
  }
}
