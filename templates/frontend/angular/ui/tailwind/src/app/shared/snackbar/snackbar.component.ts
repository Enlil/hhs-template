import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { AppIconName } from '../../core/icons';

export type SnackbarStatus = 'success' | 'alert' | 'warning';

// The border is a whole class name, so Tailwind can find it. The icon is coloured through <ng-icon>'s own
// `color` input: a component's own styles outrank Tailwind's classes.
const STATUS_STYLES: Record<SnackbarStatus, { border: string; color: string; name: AppIconName }> = {
  success: { border: 'border-success', color: 'var(--color-success)', name: 'heroCheckCircleSolid' },
  alert: { border: 'border-alert', color: 'var(--color-alert)', name: 'heroXCircleSolid' },
  warning: { border: 'border-warning', color: 'var(--color-warning)', name: 'heroExclamationTriangleSolid' },
};

// The guide's snackbar: a white card with a coloured edge and a status icon. Success is announced
// politely (role="status"), the others at once (role="alert"). Put the message inside it.
@Component({
  selector: 'app-snackbar',
  imports: [NgIcon],
  templateUrl: './snackbar.component.html',
})
export class SnackbarComponent {
  @Input() status: SnackbarStatus = 'success';
  /** Shows a close button; `closed` fires when it is pressed. */
  @Input() dismissible = false;
  @Input() className = '';
  @Output() closed = new EventEmitter<void>();

  protected get styles(): { border: string; color: string; name: AppIconName } {
    return STATUS_STYLES[this.status];
  }

  protected get role(): string {
    return this.status === 'success' ? 'status' : 'alert';
  }
}
