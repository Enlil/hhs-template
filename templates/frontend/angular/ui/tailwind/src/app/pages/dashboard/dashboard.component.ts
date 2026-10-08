import { DatePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ExampleLoader } from '../../core/example-loader';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { SnackbarComponent } from '../../shared/snackbar/snackbar.component';

// ExampleLoader (core/) loads the API example and provides `apiState` and
// `loadExample()`, which the template below renders and wires to Retry.
@Component({
  selector: 'app-dashboard',
  imports: [ButtonComponent, CardComponent, ModalComponent, SnackbarComponent, DatePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent extends ExampleLoader {
  protected modalOpen = false;
}
