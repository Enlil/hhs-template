import { NavLink } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../lib/navigation';
import { menuItemClasses } from './MenuItem';

// Hidden below `sm` rather than a collapsible drawer — the simplest
// responsive behavior that satisfies the v1 "collapse on small screens" brief.
export function Sidebar(): React.JSX.Element {
  return (
    <aside className="glass hidden w-[var(--sidebar-width)] shrink-0 self-start rounded-md p-4 sm:block">
      <nav aria-label="Sidebar" className="flex flex-col gap-2">
        {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => menuItemClasses(isActive)}>
            {Icon ? <Icon className="size-5 shrink-0" aria-hidden="true" /> : null}
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
