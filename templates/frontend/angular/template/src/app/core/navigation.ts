import type { AppIconName } from './icons';

// Everywhere the app can go. The top navigation, the sidebar and the routes in
// app.routes.ts all read from here, so a link can't exist without a page behind it.
export interface NavItem {
  label: string;
  path: string;
  /** A Heroicons icon (see icons.ts), shown beside the label in the sidebar. */
  icon?: AppIconName;
}

export const TOP_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Projects', path: '/projects' },
  { label: 'Reports', path: '/reports' },
  { label: 'Settings', path: '/settings' },
];

export const SIDEBAR_LINKS: NavItem[] = [
  { label: 'Link One', path: '/link-one', icon: 'heroSquares2x2Solid' },
  { label: 'Link Two', path: '/link-two', icon: 'heroViewColumnsSolid' },
  { label: 'Link Three', path: '/link-three', icon: 'heroDocumentTextSolid' },
  { label: 'Link Four', path: '/link-four', icon: 'heroUsersSolid' },
  { label: 'Design guide', path: '/design-guide', icon: 'heroSwatchSolid' },
];

// The destinations with a real page of their own (app.routes.ts has a route for each).
const PAGES_WITH_CONTENT = ['/dashboard', '/design-guide'];

// Every other destination gets a placeholder page for now.
export const PLACEHOLDER_PAGES: NavItem[] = [...TOP_NAV_ITEMS, ...SIDEBAR_LINKS].filter(
  (item) => !PAGES_WITH_CONTENT.includes(item.path),
);
