import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import type { AppIconName } from '../../core/icons';

// The look of one menu item, shared by <app-menu-item> and the sidebar (whose items are links): a pill,
// filled blue for the page you are on.
export function menuItemClasses(active: boolean): string {
  return `flex items-center gap-3 rounded-pill p-3.5 text-content-3 transition-colors ${
    active ? 'bg-primary text-primary-foreground' : 'bg-surface/60 text-text hover:bg-surface/80'
  }`;
}

@Component({
  selector: 'app-menu-item',
  imports: [NgIcon],
  templateUrl: './menu-item.component.html',
})
export class MenuItemComponent {
  @Input() label = '';
  @Input() icon?: AppIconName;
  @Input() active = false;
  /** Shows a chevron, for an item that opens a submenu. */
  @Input() expandable = false;
  @Output() activated = new EventEmitter<void>();

  protected readonly menuItemClasses = menuItemClasses;
}
