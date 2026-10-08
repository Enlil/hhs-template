import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="mx-auto w-full max-w-6xl">{children}</div>;
}
