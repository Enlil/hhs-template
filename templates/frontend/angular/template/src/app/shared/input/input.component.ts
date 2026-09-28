import { Component, Input } from '@angular/core';

let nextInputId = 0;

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
})
export class InputComponent {
  @Input() label = '';
  @Input() type = 'text';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() required = false;

  protected readonly inputId = `app-input-${++nextInputId}`;
}
