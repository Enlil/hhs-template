import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

// The real <input> is hidden but still does the work (keyboard, form value); the box next to it is only
// the drawing, shown through the `peer` classes.
@Component({
  selector: 'app-checkbox',
  imports: [NgIcon],
  templateUrl: './checkbox.component.html',
})
export class CheckboxComponent {
  @Input() label = '';
  @Input() name = '';
  @Input() checked = false;
  @Input() disabled = false;
  @Input() className = '';
  @Output() checkedChange = new EventEmitter<boolean>();

  protected onChange(event: Event): void {
    this.checkedChange.emit((event.target as HTMLInputElement).checked);
  }
}
