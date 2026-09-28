import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() className = '';

  protected get classes(): string {
    const base =
      'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    const variantClasses =
      this.variant === 'primary'
        ? 'bg-primary text-primary-foreground hover:opacity-90'
        : 'border border-border bg-surface text-text hover:bg-background';
    return `${base} ${variantClasses} ${this.className}`;
  }
}
