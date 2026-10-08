import { DocumentTextIcon, Squares2X2Icon, SwatchIcon, UsersIcon, ViewColumnsIcon } from '@heroicons/react/24/solid';

// Everywhere the app can go. The top navigation, the sidebar and the routes in
// App.tsx all read from here, so a link can't exist without a page behind it.
export interface NavItem {
  label: string;
  to: string;
  /** A Heroicons icon, shown beside the label in the sidebar. */
  icon?: typeof Squares2X2Icon;
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Projects', to: '/projects' },
  { label: 'Reports', to: '/reports' },
  { label: 'Settings', to: '/settings' },
];

export const SIDEBAR_ITEMS: NavItem[] = [
  { label: 'Link One', to: '/link-one', icon: Squares2X2Icon },
  { label: 'Link Two', to: '/link-two', icon: ViewColumnsIcon },
  { label: 'Link Three', to: '/link-three', icon: DocumentTextIcon },
  { label: 'Link Four', to: '/link-four', icon: UsersIcon },
  { label: 'Design guide', to: '/design-guide', icon: SwatchIcon },
];

// The destinations with a real page of their own (App.tsx has a route for each).
const PAGES_WITH_CONTENT = ['/dashboard', '/design-guide'];

// Every other destination gets a placeholder page for now.
export const PLACEHOLDER_PAGES: NavItem[] = [...TOP_NAV_ITEMS, ...SIDEBAR_ITEMS].filter(
  (item) => !PAGES_WITH_CONTENT.includes(item.to),
);
