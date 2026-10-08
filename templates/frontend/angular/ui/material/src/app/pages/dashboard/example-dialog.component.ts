import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

// Opened from the dashboard's "View details" button (see dashboard.component.ts).
// An example of Angular Material's dialog: swap in your own content.
@Component({
  selector: 'app-example-dialog',
  imports: [MatButtonModule, MatDialogModule],
  templateUrl: './example-dialog.component.html',
})
export class ExampleDialogComponent {}
