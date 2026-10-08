import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { PLACEHOLDER_PAGES } from './lib/navigation';
import { DashboardPage } from './pages/DashboardPage';
import { DesignGuidePage } from './pages/DesignGuidePage';
import { LoginPage } from './pages/LoginPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

// AppShell and the pages come from the CSS framework folder chosen when the
// project was generated (see ui/ in the template); the routes don't care which.
// Every nav destination (lib/navigation.ts) gets a route here, or its link would
// fall through to the catch-all below.
export default function App(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/design-guide" element={<DesignGuidePage />} />
        {PLACEHOLDER_PAGES.map(({ to, label }) => (
          <Route key={to} path={to} element={<PlaceholderPage title={label} />} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
