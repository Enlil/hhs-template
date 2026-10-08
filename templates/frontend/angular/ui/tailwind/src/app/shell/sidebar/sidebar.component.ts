import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { SIDEBAR_LINKS, type NavItem } from '../../core/navigation';
import { menuItemClasses } from '../../shared/menu-item/menu-item.component';

// Hidden below `sm` rather than a collapsible drawer — the simplest
// responsive behavior that satisfies the v1 "collapse on small screens" brief.
@Component({
  selector: 'app-sidebar',
  imports: [NgIcon, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  protected readonly links: NavItem[] = SIDEBAR_LINKS;

  protected linkClasses(active: boolean): string {
    return menuItemClasses(active);
  }
}
