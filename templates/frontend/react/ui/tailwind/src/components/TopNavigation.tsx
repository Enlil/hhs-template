import { NavLink } from 'react-router-dom';
import { TOP_NAV_ITEMS } from '../lib/navigation';
import { tabClasses } from './Tabs';

export function TopNavigation(): React.JSX.Element {
  return (
    <nav aria-label="Main" className="glass rounded-md px-2 sm:px-4">
      <div className="flex overflow-x-auto [scrollbar-width:none]">
        {TOP_NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => tabClasses(isActive)}>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
