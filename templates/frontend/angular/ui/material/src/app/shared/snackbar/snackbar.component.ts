import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { NgIcon } from '@ng-icons/core';
import type { AppIconName } from '../../core/icons';

export type SnackbarStatus = 'success' | 'alert' | 'warning';

const STATUS_ICONS: Record<SnackbarStatus, AppIconName> = {
  success: 'heroCheckCircleSolid',
  alert: 'heroXCircleSolid',
  warning: 'heroExclamationTriangleSolid',
};

// The guide's snackbar, shown in the page rather than popping up: a white card with a coloured edge and a
// status icon. (For a message that pops up and goes away on its own, use Material's MatSnackBar service.)
// Success is announced politely (role="status"), the others at once (role="alert"). Put the message inside it.
@Component({
  selector: 'app-snackbar',
  imports: [MatIconButton, NgIcon],
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.css',
})
export class SnackbarComponent {
  @Input() status: SnackbarStatus = 'success';
  /** Shows a close button; `closed` fires when it is pressed. */
  @Input() dismissible = false;
  @Output() closed = new EventEmitter<void>();

  protected get icon(): AppIconName {
    return STATUS_ICONS[this.status];
  }

  protected get role(): string {
    return this.status === 'success' ? 'status' : 'alert';
  }
}
