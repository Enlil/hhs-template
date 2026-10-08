import type { HTMLAttributes } from 'react';

// A small label with a thin blue edge, like the guide's tag.
export function Tag({ className = '', ...props }: HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={`inline-flex items-center rounded-sm border border-primary/50 bg-surface/50 px-2 text-content-3 leading-6 text-text ${className}`}
      {...props}
    />
  );
}
