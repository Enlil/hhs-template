import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import MuiRadio from '@mui/material/Radio';
import type { RadioProps as MuiRadioProps } from '@mui/material/Radio';
import tokens from '../styles/tokens.json';
import { focusRing } from '../theme';

const circle = {
  display: 'flex',
  width: 24,
  height: 24,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  border: `1px solid ${tokens.color.baseLight}`,
  backgroundColor: 'background.paper',
};

export interface RadioProps extends Omit<MuiRadioProps, 'icon' | 'checkedIcon'> {
  label: string;
}

// The guide's radio button: a white circle, with a blue dot when it is picked. Use it in a MUI <RadioGroup>.
export function Radio({ label, sx, ...props }: RadioProps): React.JSX.Element {
  return (
    <FormControlLabel
      label={label}
      value={props.value}
      control={
        <MuiRadio
          disableRipple
          icon={<Box component="span" sx={circle} />}
          checkedIcon={
            <Box component="span" sx={{ ...circle, borderColor: 'primary.main' }}>
              <Box component="span" sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
            </Box>
          }
          sx={[{ p: 0, '&.Mui-focusVisible': focusRing }, ...(Array.isArray(sx) ? sx : [sx])]}
          {...props}
        />
      }
    />
  );
}
