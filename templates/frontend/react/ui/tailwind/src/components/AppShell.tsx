import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { PageContainer } from './PageContainer';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';

// A layout route (see App.tsx): renders once, and each nav destination
// fills in <Outlet/> without remounting the header/nav/sidebar around it.
// The light page itself is the <body> (see src/styles/base.css); header,
// navigation and sidebar float on it as translucent panels.
export function AppShell(): React.JSX.Element {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[90rem] flex-col gap-4 p-4 sm:p-6">
      <Header />
      <TopNavigation />
      <div className="flex flex-1 items-start gap-4">
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
