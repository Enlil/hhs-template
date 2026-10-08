import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';

// The guide's search field: a wide, translucent pill with a magnifying glass. `className` goes on the whole field.
@Component({
  selector: 'app-search-field',
  imports: [NgIcon],
  templateUrl: './search-field.component.html',
})
export class SearchFieldComponent {
  @Input() placeholder = 'Search for anything';
  @Input() className = '';
  @Output() valueChange = new EventEmitter<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
