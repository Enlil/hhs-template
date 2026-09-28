import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// Every top-nav and sidebar destination (see TopNavigation.tsx / Sidebar.tsx)
// needs a matching route here, or its link would 404 via the catch-all below.
const PLACEHOLDER_ROUTES: Array<{ path: string; title: string }> = [
  { path: 'projects', title: 'Projects' },
  { path: 'reports', title: 'Reports' },
  { path: 'settings', title: 'Settings' },
  { path: 'link-one', title: 'Link One' },
  { path: 'link-two', title: 'Link Two' },
  { path: 'link-three', title: 'Link Three' },
  { path: 'link-four', title: 'Link Four' },
];

export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        {PLACEHOLDER_ROUTES.map(({ path, title }) => (
          <Route key={path} path={`/${path}`} element={<PlaceholderPage title={title} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
