import { NavLink } from 'react-router-dom';

const SIDEBAR_ITEMS = [
  { label: 'Link One', to: '/link-one' },
  { label: 'Link Two', to: '/link-two' },
  { label: 'Link Three', to: '/link-three' },
  { label: 'Link Four', to: '/link-four' },
];

// Hidden below `sm` rather than a collapsible drawer — the simplest
// responsive behavior that satisfies the v1 "collapse on small screens" brief.
export function Sidebar(): React.JSX.Element {
  return (
    <aside className="hidden w-[var(--sidebar-width)] shrink-0 border-r border-border bg-background p-4 sm:block">
      <nav className="flex flex-col gap-1">
        {SIDEBAR_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                isActive ? 'bg-primary/10 text-primary' : 'text-text hover:bg-surface'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
