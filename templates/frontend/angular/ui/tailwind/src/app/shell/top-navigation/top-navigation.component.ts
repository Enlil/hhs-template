import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TOP_NAV_ITEMS, type NavItem } from '../../core/navigation';
import { tabClasses } from '../../shared/tabs/tabs.component';

@Component({
  selector: 'app-top-navigation',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './top-navigation.component.html',
})
export class TopNavigationComponent {
  protected readonly items: NavItem[] = TOP_NAV_ITEMS;

  // Computes the full class string (rather than letting routerLinkActive
  // append its own classes) so the active/inactive variants can't both end up
  // setting the same CSS property and racing on generated-stylesheet order.
  protected navItemClasses(active: boolean): string {
    return tabClasses(active);
  }
}
