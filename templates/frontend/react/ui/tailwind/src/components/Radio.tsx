import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

// Like Checkbox: the real <input> is hidden, the circle next to it is the drawing.
export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio({ label, className = '', ...props }, ref) {
  return (
    <label className={`inline-flex items-center gap-4 text-content-3 text-text ${className}`}>
      <input ref={ref} type="radio" className="peer sr-only" {...props} />
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-base-light bg-surface after:size-3 after:rounded-full after:bg-transparent peer-checked:border-primary peer-checked:after:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-vivid peer-disabled:opacity-50" />
      {label}
    </label>
  );
});
