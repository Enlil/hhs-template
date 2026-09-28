import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'border border-border bg-surface text-text hover:bg-background',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', className = '', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
