import { CheckIcon } from '@heroicons/react/24/solid';
import Box from '@mui/material/Box';
import MuiCheckbox from '@mui/material/Checkbox';
import type { CheckboxProps as MuiCheckboxProps } from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import tokens from '../styles/tokens.json';
import { focusRing } from '../theme';

const box = {
  display: 'flex',
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: `${tokens.radius.sm}`,
  border: `1px solid ${tokens.color.baseLight}`,
  backgroundColor: 'background.paper',
};

export interface CheckboxProps extends Omit<MuiCheckboxProps, 'icon' | 'checkedIcon'> {
  label: string;
}

// The guide's checkbox: a white box, with a blue tick when it is on.
export function Checkbox({ label, sx, ...props }: CheckboxProps): React.JSX.Element {
  return (
    <FormControlLabel
      label={label}
      control={
        <MuiCheckbox
          disableRipple
          icon={<Box component="span" sx={box} />}
          checkedIcon={
            <Box component="span" sx={{ ...box, color: 'primary.main' }}>
              <CheckIcon width={20} height={20} aria-hidden="true" />
            </Box>
          }
          sx={[{ p: 0, '&.Mui-focusVisible': focusRing }, ...(Array.isArray(sx) ? sx : [sx])]}
          {...props}
        />
      }
    />
  );
}
