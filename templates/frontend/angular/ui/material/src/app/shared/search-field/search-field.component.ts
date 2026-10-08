import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgIcon } from '@ng-icons/core';

// The guide's search field: a wide, translucent pill with a magnifying glass, made from Material's form field.
@Component({
  selector: 'app-search-field',
  imports: [MatFormFieldModule, MatInputModule, NgIcon],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.css',
})
export class SearchFieldComponent {
  @Input() placeholder = 'Search for anything';
  @Output() valueChange = new EventEmitter<string>();

  protected onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
