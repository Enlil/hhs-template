import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { APP_NAME } from '../lib/config';
import { APP_VERSION } from '../lib/version';

export function Footer(): React.JSX.Element {
  return (
    <Box component="footer" sx={{ flexShrink: 0, py: 1, textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary">
        {APP_NAME} &middot; v{APP_VERSION}
      </Typography>
    </Box>
  );
}
