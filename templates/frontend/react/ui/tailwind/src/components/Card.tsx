import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: ReactNode;
}

// A translucent white panel (the `glass` class, see src/styles/tailwind-theme.css).
export function Card({ title, children, className = '', ...props }: CardProps): React.JSX.Element {
  return (
    <div className={`glass rounded-md p-6 ${className}`} {...props}>
      {title ? <h2 className="mb-3">{title}</h2> : null}
      {children}
    </div>
  );
}
