import { Component, EventEmitter, Input, Output } from '@angular/core';
import { uniqueId } from '../../core/unique-id';

// Like InputComponent, for longer text. `className` goes on the whole field.
@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
})
export class TextareaComponent {
  @Input() label = '';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() value = '';
  @Input() rows = 3;
  @Input() className = '';
  @Output() valueChange = new EventEmitter<string>();

  protected readonly textareaId = uniqueId('app-textarea');

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
