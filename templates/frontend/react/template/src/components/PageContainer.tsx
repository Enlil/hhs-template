import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>;
}
