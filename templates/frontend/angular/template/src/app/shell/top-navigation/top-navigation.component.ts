import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  path: string;
}

@Component({
  selector: 'app-top-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-navigation.component.html',
})
export class TopNavigationComponent {
  protected readonly items: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Reports', path: '/reports' },
    { label: 'Settings', path: '/settings' },
  ];

  // Computes the full class string (rather than letting routerLinkActive
  // append its own classes) so the active/inactive variants can't both end up
  // setting the same CSS property and racing on generated-stylesheet order.
  protected navItemClasses(active: boolean): string {
    const base = 'shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors';
    return active ? `${base} border-primary text-primary` : `${base} border-transparent text-muted hover:text-text`;
  }
}
