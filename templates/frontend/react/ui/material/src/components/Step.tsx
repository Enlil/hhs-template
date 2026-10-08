import Box from '@mui/material/Box';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

export interface StepProps {
  number: number;
  label: string;
  active?: boolean;
}

// One step of a process, like "1 Capture Document". The one you are on is `active`.
export function Step({ number, label, active = false }: StepProps): React.JSX.Element {
  return (
    <Box
      aria-current={active ? 'step' : undefined}
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 2,
        borderRadius: '24px',
        bgcolor: active ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.background.paper, 0.2),
      })}
    >
      <Box
        component="span"
        sx={(theme) => ({
          display: 'flex',
          width: 56,
          height: 56,
          flexShrink: 0,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          bgcolor: active ? 'primary.main' : alpha(theme.palette.background.paper, 0.6),
          color: active ? 'primary.contrastText' : 'text.primary',
        })}
      >
        <Typography variant="h2" component="span">
          {number}
        </Typography>
      </Box>
      <Typography variant="h2" component="span">
        {label}
      </Typography>
    </Box>
  );
}
