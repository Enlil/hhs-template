import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { ApiService, type ExampleResponse } from '../../core/api.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { ModalComponent } from '../../shared/modal/modal.component';

type ApiState =
  | { status: 'loading' }
  | { status: 'success'; data: ExampleResponse }
  | { status: 'error'; message: string };

@Component({
  selector: 'app-dashboard',
  imports: [ButtonComponent, CardComponent, ModalComponent, DatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private readonly api = inject(ApiService);

  protected apiState: ApiState = { status: 'loading' };
  protected modalOpen = false;

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
