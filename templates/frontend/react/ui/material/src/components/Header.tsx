import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import seal from '../assets/hhs-seal.png';
import { APP_NAME } from '../lib/config';
import { glass } from '../theme';
import { SearchField } from './SearchField';

// The search field and the avatar are for show: nothing is searched and nobody is signed in until you add it.
export function Header(): React.JSX.Element {
  return (
    <Box
      component="header"
      sx={{
        ...glass,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: 'var(--header-height)',
        px: { xs: 2, sm: 3 },
        py: 1.5,
        borderRadius: 1,
      }}
    >
      <Box component="img" src={seal} alt="" sx={{ width: 40, height: 40 }} />
      <Typography variant="h2" component="span">
        {APP_NAME}
      </Typography>
      <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
        <SearchField sx={{ display: { xs: 'none', md: 'flex' }, width: { md: 288, lg: 448 } }} />
        <Avatar role="img" aria-label="User" sx={{ width: 40, height: 40, fontSize: '0.875rem' }}>
          U
        </Avatar>
      </Box>
    </Box>
  );
}
