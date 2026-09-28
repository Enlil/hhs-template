import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, className = '', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={`rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
        {...props}
      />
    </div>
  );
});
