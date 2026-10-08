import { ChevronDownIcon } from '@heroicons/react/24/solid';
import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

// A native <select> drawn like the guide's select: a white pill with a chevron. `className` goes on the whole field.
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, id, className = '', children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label ? (
        <label htmlFor={selectId} className="text-content-2 text-muted">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className="h-12 w-full appearance-none rounded-xl bg-surface pr-12 pl-5 text-content-3 text-text disabled:opacity-50"
          {...props}
        >
          {children}
        </select>
        <ChevronDownIcon
          className="pointer-events-none absolute top-1/2 right-5 size-5 -translate-y-1/2 text-text"
          aria-hidden="true"
        />
      </div>
    </div>
  );
});
