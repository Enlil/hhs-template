import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { AppIconName } from '../../core/icons';

export interface ToggleOption {
  value: string;
  /** Read out by screen readers: the options are only icons. */
  label: string;
  icon: AppIconName;
}

// The guide's toggle: a white pill with one icon button per choice, the picked one filled blue.
@Component({
  selector: 'app-segmented-toggle',
  imports: [NgIcon],
  templateUrl: './segmented-toggle.component.html',
})
export class SegmentedToggleComponent {
  /** What is being switched, for screen readers: "Theme". */
  @Input() label = '';
  @Input() options: ToggleOption[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
