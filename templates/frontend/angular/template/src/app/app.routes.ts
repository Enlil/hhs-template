import type { Routes } from '@angular/router';
import { PLACEHOLDER_PAGES } from './core/navigation';
import { AppShellComponent } from './shell/app-shell/app-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DesignGuideComponent } from './pages/design-guide/design-guide.component';
import { LoginComponent } from './pages/login/login.component';
import { PlaceholderComponent } from './pages/placeholder/placeholder.component';

// The shell and the pages come from the CSS framework folder chosen when the
// project was generated (see ui/ in the template); the routes don't care which.
// Every nav destination (core/navigation.ts) needs a child route here, or its
// link would redirect to "" via the catch-all below.
const PLACEHOLDER_ROUTES = PLACEHOLDER_PAGES.map(({ path, label }) => ({
  path: path.replace(/^\//, ''), // router paths have no leading slash
  component: PlaceholderComponent,
  data: { title: label },
}));

// The shell (header/nav/sidebar) lives on a layout route so it wraps every
// authenticated page via <router-outlet>, while the login screen renders on
// its own — the same split React implements with the AppShell layout route.
export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'design-guide', component: DesignGuideComponent },
      ...PLACEHOLDER_ROUTES,
    ],
  },
  { path: '**', redirectTo: '' },
];
