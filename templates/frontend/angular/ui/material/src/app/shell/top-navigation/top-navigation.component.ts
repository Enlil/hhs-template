import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TOP_NAV_ITEMS, type NavItem } from '../../core/navigation';

@Component({
  selector: 'app-top-navigation',
  imports: [MatButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './top-navigation.component.html',
  styleUrl: './top-navigation.component.css',
})
export class TopNavigationComponent {
  protected readonly items: NavItem[] = TOP_NAV_ITEMS;
}
