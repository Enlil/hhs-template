import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  /** Text or an icon shown inside the field, before the value: the "$" of a price, say. */
  startAdornment?: ReactNode;
}

// The guide's text field: the label above, then a white pill. `className` goes on the whole field, so it
// can set the width.
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, id, className = '', startAdornment, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-content-2 text-muted">
          {label}
        </label>
      ) : null}
      <div className="flex h-12 items-center gap-2 rounded-xl bg-surface px-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-vivid has-[input:disabled]:opacity-50">
        {startAdornment ? <span className="text-content-3 text-subtle">{startAdornment}</span> : null}
        <input
          ref={ref}
          id={inputId}
          className="min-w-0 flex-1 bg-transparent text-content-3 text-text outline-none placeholder:text-subtle"
          {...props}
        />
      </div>
    </div>
  );
});
