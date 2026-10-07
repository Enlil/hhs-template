import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageContainer } from './PageContainer';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';

// A layout route (see App.tsx): renders once, and each nav destination
// fills in <Outlet/> without remounting the header/nav/sidebar around it.
export function AppShell(): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <TopNavigation />
      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <PageContainer>
            <Outlet />
          </PageContainer>
        </main>
      </div>
      <Footer />
    </div>
  );
}
