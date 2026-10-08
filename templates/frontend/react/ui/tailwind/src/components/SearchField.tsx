import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

// The guide's search field: a wide, translucent pill with a magnifying glass. `className` goes on the whole field.
export const SearchField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function SearchField(
  { className = '', ...props },
  ref,
) {
  return (
    <div
      role="search"
      className={`flex items-center gap-3 rounded-pill bg-surface/80 px-8 py-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary-vivid ${className}`}
    >
      <MagnifyingGlassIcon className="size-6 shrink-0 text-text" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        aria-label="Search"
        placeholder="Search for anything"
        className="min-w-0 flex-1 bg-transparent text-content-1 text-text outline-none placeholder:text-subtle"
        {...props}
      />
    </div>
  );
});
