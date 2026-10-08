import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ExampleLoader } from '../../core/example-loader';
import { SnackbarComponent } from '../../shared/snackbar/snackbar.component';
import { ExampleDialogComponent } from './example-dialog.component';

// ExampleLoader (core/) loads the API example and provides `apiState` and
// `loadExample()`, which the template below renders and wires to Retry.
@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, MatButtonModule, MatCardModule, SnackbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent extends ExampleLoader {
  private readonly dialog = inject(MatDialog);

  protected openDetails(): void {
    this.dialog.open(ExampleDialogComponent);
  }
}
