import { Component, Input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

// The guide's three buttons: filled, light blue, and outlined.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-vivid',
  secondary:
    'bg-primary-lighter text-primary hover:bg-[color-mix(in_srgb,var(--color-primary-lighter),var(--color-primary)_12%)]',
  tertiary: 'border border-primary text-primary hover:bg-primary-lighter',
};

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
      'inline-flex items-center justify-center gap-2 rounded-pill px-8 py-4 text-content-1 transition-colors disabled:pointer-events-none disabled:opacity-50';
    return `${base} ${VARIANT_CLASSES[this.variant]} ${this.className}`;
  }
}
