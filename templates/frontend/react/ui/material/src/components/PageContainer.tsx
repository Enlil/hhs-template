import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

export function PageContainer({ children }: { children: ReactNode }): React.JSX.Element {
  return <Box sx={{ maxWidth: '72rem', width: '100%', mx: 'auto' }}>{children}</Box>;
}
