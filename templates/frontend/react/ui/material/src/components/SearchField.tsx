import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import type { OutlinedInputProps } from '@mui/material/OutlinedInput';
import { alpha } from '@mui/material/styles';

// The guide's search field: a wide, translucent pill with a magnifying glass.
export function SearchField({ sx, ...props }: OutlinedInputProps): React.JSX.Element {
  return (
    <OutlinedInput
      role="search"
      placeholder="Search for anything"
      inputProps={{ type: 'search', 'aria-label': 'Search' }}
      startAdornment={
        <InputAdornment position="start" sx={{ mr: 1.5, color: 'text.primary' }}>
          <MagnifyingGlassIcon width={24} height={24} aria-hidden="true" />
        </InputAdornment>
      }
      sx={[
        (theme) => ({
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderRadius: '9999px',
          px: 4,
          typography: 'body1',
          '& .MuiOutlinedInput-input': { padding: '16px 0', fontSize: 'inherit', lineHeight: 'inherit' },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
