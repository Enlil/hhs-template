import { Component, Input } from '@angular/core';

// One step of a process, like "1 Capture Document". The one you are on is `active`.
@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
})
export class StepComponent {
  @Input() number = 1;
  @Input() label = '';
  @Input() active = false;
}
