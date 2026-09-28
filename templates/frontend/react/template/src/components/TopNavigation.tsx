import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Projects', to: '/projects' },
  { label: 'Reports', to: '/reports' },
  { label: 'Settings', to: '/settings' },
];

export function TopNavigation(): React.JSX.Element {
  return (
    <nav className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 sm:px-6">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `shrink-0 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                isActive ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-text'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
