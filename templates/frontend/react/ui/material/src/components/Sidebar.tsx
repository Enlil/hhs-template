import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import { NavLink } from 'react-router-dom';
import { SIDEBAR_ITEMS } from '../lib/navigation';
import { glass } from '../theme';
import { pillMenuItemSx } from './PillMenuItem';

// Hidden below `sm` rather than a collapsible drawer — the simplest
// responsive behavior that satisfies the v1 "collapse on small screens" brief.
export function Sidebar(): React.JSX.Element {
  return (
    <Box
      component="aside"
      sx={{
        ...glass,
        display: { xs: 'none', sm: 'block' },
        width: 'var(--sidebar-width)',
        flexShrink: 0,
        alignSelf: 'flex-start',
        borderRadius: 1,
        p: 2,
      }}
    >
      <List component="nav" aria-label="Sidebar" disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {SIDEBAR_ITEMS.map(({ to, label, icon: Icon }) => (
          <ListItemButton key={to} component={NavLink} to={to} sx={pillMenuItemSx}>
            {Icon ? <Icon width={20} height={20} aria-hidden="true" /> : null}
            {label}
          </ListItemButton>
        ))}
      </List>
    </Box>
  );
}
