import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import Alert from '@mui/material/Alert';
import type { AlertProps } from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';

export type SnackbarStatus = 'success' | 'alert' | 'warning';

const SEVERITY: Record<SnackbarStatus, AlertProps['severity']> = { success: 'success', alert: 'error', warning: 'warning' };
const ICON: Record<SnackbarStatus, ReactNode> = {
  success: <CheckCircleIcon width={32} height={32} aria-hidden="true" />,
  alert: <XCircleIcon width={32} height={32} aria-hidden="true" />,
  warning: <ExclamationTriangleIcon width={32} height={32} aria-hidden="true" />,
};

export interface SnackbarProps {
  status: SnackbarStatus;
  children: ReactNode;
  /** Shows a close button when given. */
  onClose?: () => void;
  sx?: AlertProps['sx'];
}

// The guide's snackbar: a white card with a coloured edge and a status icon (the look is the theme's
// <Alert>, in src/theme.ts). Success is announced politely (role="status"), the others at once.
export function Snackbar({ status, children, onClose, sx }: SnackbarProps): React.JSX.Element {
  return (
    <Alert
      severity={SEVERITY[status]}
      icon={ICON[status]}
      role={status === 'success' ? 'status' : 'alert'}
      action={
        onClose ? (
          <IconButton aria-label="Dismiss" onClick={onClose} color="inherit" size="small">
            <XMarkIcon width={24} height={24} aria-hidden="true" />
          </IconButton>
        ) : undefined
      }
      sx={sx}
    >
      {children}
    </Alert>
  );
}
