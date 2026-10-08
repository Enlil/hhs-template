import { ChevronDownIcon } from '@heroicons/react/24/solid';
import type { ComponentType } from 'react';

// The look of one menu item, shared by <MenuItem> and the sidebar (whose items are links): a pill, filled
// blue for the page you are on.
export function menuItemClasses(active: boolean): string {
  return `flex items-center gap-3 rounded-pill p-3.5 text-content-3 transition-colors ${
    active ? 'bg-primary text-primary-foreground' : 'bg-surface/60 text-text hover:bg-surface/80'
  }`;
}

export interface MenuItemProps {
  label: string;
  icon?: ComponentType<{ className?: string }>;
  active?: boolean;
  /** Shows a chevron, for an item that opens a submenu. */
  expandable?: boolean;
  onClick?: () => void;
}

export function MenuItem({ label, icon: Icon, active = false, expandable = false, onClick }: MenuItemProps): React.JSX.Element {
  return (
    <button type="button" aria-current={active ? 'page' : undefined} onClick={onClick} className={menuItemClasses(active)}>
      {Icon ? <Icon className="size-5 shrink-0" /> : null}
      {label}
      {expandable ? <ChevronDownIcon className="size-5 shrink-0" aria-hidden="true" /> : null}
    </button>
  );
}
