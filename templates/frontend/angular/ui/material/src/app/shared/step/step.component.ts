import { Component, Input } from '@angular/core';

// One step of a process, like "1 Capture Document". The one you are on is `active`. (Angular Material's
// own stepper is for forms that move through steps; this is only the guide's pill.)
@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrl: './step.component.css',
})
export class StepComponent {
  @Input() number = 1;
  @Input() label = '';
  @Input() active = false;
}
