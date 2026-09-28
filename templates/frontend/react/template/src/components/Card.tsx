import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

export function Card({ title, children, className = '', ...props }: CardProps): React.JSX.Element {
  return (
    <div className={`rounded-lg border border-border bg-surface p-6 shadow-sm ${className}`} {...props}>
      {title ? <h3 className="mb-2 text-base font-semibold text-text">{title}</h3> : null}
      {children}
    </div>
  );
}
