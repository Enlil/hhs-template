import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { NavLink } from 'react-router-dom';
import { TOP_NAV_ITEMS } from '../lib/navigation';
import tokens from '../styles/tokens.json';
import { glass } from '../theme';

// NavLink adds the "active" class and aria-current="page" to the link for the
// page you are on; the styles below turn that into the blue line under it.
export function TopNavigation(): React.JSX.Element {
  return (
    <Box component="nav" aria-label="Main" sx={{ ...glass, borderRadius: 1, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TOP_NAV_ITEMS.map((item) => (
          <Button
            key={item.to}
            component={NavLink}
            to={item.to}
            color="inherit"
            sx={{
              flexShrink: 0,
              px: 3,
              py: 2,
              borderRadius: 0,
              borderBottom: '2px solid transparent',
              typography: 'h4',
              color: 'text.primary',
              '&:hover': { backgroundColor: 'transparent', borderBottomColor: tokens.color.baseLight },
              '&.active': { borderBottomColor: 'primary.main' },
            }}
          >
            {item.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
}
