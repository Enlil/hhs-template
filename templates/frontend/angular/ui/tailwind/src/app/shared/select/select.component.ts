import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { uniqueId } from '../../core/unique-id';

// A native <select> drawn like the guide's select: a white pill with a chevron. Put <option>s inside it:
//   <app-select label="Relationship" value="parent"><option value="parent">Parent</option></app-select>
@Component({
  selector: 'app-select',
  imports: [NgIcon],
  templateUrl: './select.component.html',
})
export class SelectComponent implements AfterViewInit {
  @Input() label = '';
  @Input() name = '';
  @Input() disabled = false;
  /** The `value` of the option shown first. */
  @Input() value = '';
  @Input() className = '';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('field') private readonly field!: ElementRef<HTMLSelectElement>;

  protected readonly selectId = uniqueId('app-select');

  // The options are handed in from outside, so they only exist once the view is up.
  ngAfterViewInit(): void {
    this.field.nativeElement.value = this.value;
  }

  protected onChange(event: Event): void {
    this.valueChange.emit((event.target as HTMLSelectElement).value);
  }
}
