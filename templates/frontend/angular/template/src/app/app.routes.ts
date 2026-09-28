import type { Routes } from '@angular/router';
import { AppShellComponent } from './shell/app-shell/app-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { PlaceholderComponent } from './pages/placeholder/placeholder.component';

// Every top-nav and sidebar destination (see top-navigation/sidebar
// components) needs a matching child route here, or its link would redirect
// to "" via the catch-all below.
const PLACEHOLDER_ROUTES = [
  { path: 'projects', title: 'Projects' },
  { path: 'reports', title: 'Reports' },
  { path: 'settings', title: 'Settings' },
  { path: 'link-one', title: 'Link One' },
  { path: 'link-two', title: 'Link Two' },
  { path: 'link-three', title: 'Link Three' },
  { path: 'link-four', title: 'Link Four' },
].map(({ path, title }) => ({ path, component: PlaceholderComponent, data: { title } }));

// The shell (header/nav/sidebar) lives on a layout route so it wraps every
// authenticated page via <router-outlet>, while the login screen renders on
// its own — the same split React implements with the AppShell layout route.
export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: '',
    component: AppShellComponent,
    children: [{ path: 'dashboard', component: DashboardComponent }, ...PLACEHOLDER_ROUTES],
  },
  { path: '**', redirectTo: '' },
];
