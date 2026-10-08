import { CheckIcon } from '@heroicons/react/24/solid';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

// The real <input> is hidden but still does the work (keyboard, form value); the box next to it is only
// the drawing, shown through the `peer` classes.
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className = '', ...props },
  ref,
) {
  return (
    <label className={`inline-flex items-center gap-4 text-content-3 text-text ${className}`}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-base-light bg-surface text-transparent peer-checked:text-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-vivid peer-disabled:opacity-50">
        <CheckIcon className="size-5" aria-hidden="true" />
      </span>
      {label}
    </label>
  );
});
