import { Component, EventEmitter, Input, Output } from '@angular/core';
import { uniqueId } from '../../core/unique-id';

// The guide's text field: the label above, then a white pill. `className` goes on the whole field, so it
// can set the width. Bind `[(value)]` to read what is typed.
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
  @Input() disabled = false;
  @Input() value = '';
  @Input() inputMode = '';
  /** Text shown inside the field, before the value: the "$" of a price, say. */
  @Input() adornment = '';
  @Input() className = '';
  @Output() valueChange = new EventEmitter<string>();

  protected readonly inputId = uniqueId('app-input');

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
