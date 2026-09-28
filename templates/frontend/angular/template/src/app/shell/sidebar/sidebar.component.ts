import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface SidebarLink {
  label: string;
  path: string;
}

// Hidden below `sm` rather than a collapsible drawer — the simplest
// responsive behavior that satisfies the v1 "collapse on small screens" brief.
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly links: SidebarLink[] = [
    { label: 'Link One', path: '/link-one' },
    { label: 'Link Two', path: '/link-two' },
    { label: 'Link Three', path: '/link-three' },
    { label: 'Link Four', path: '/link-four' },
  ];

  protected linkClasses(active: boolean): string {
    const base = 'rounded-md px-3 py-2 text-left text-sm font-medium transition-colors';
    return active ? `${base} bg-primary/10 text-primary` : `${base} text-text hover:bg-surface`;
  }
}
