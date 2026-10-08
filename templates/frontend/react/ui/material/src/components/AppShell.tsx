import Box from '@mui/material/Box';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageContainer } from './PageContainer';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';

// A layout route (see App.tsx): renders once, and each nav destination
// fills in <Outlet/> without remounting the header/nav/sidebar around it.
// The blue page itself is the <body> (see src/styles/base.css); header,
// navigation and sidebar float on it as translucent panels.
export function AppShell(): React.JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minHeight: '100vh',
        width: '100%',
        maxWidth: '90rem',
        mx: 'auto',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Header />
      <TopNavigation />
      <Box sx={{ display: 'flex', flex: 1, alignItems: 'flex-start', gap: 2 }}>
        <Sidebar />
        <Box component="main" sx={{ minWidth: 0, flex: 1 }}>
          <PageContainer>
            <Outlet />
          </PageContainer>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
}
