import { Component, EventEmitter, Input, Output } from '@angular/core';

// Like CheckboxComponent: the real <input> is hidden, the circle next to it is the drawing. Radios with
// the same `name` are one group.
@Component({
  selector: 'app-radio',
  templateUrl: './radio.component.html',
})
export class RadioComponent {
  @Input() label = '';
  @Input() name = '';
  @Input() value = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Input() className = '';
  /** Emits this radio's `value` when it is picked. */
  @Output() picked = new EventEmitter<string>();

  protected onChange(): void {
    this.picked.emit(this.value);
  }
}
