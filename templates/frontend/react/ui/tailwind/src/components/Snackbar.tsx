import { CheckCircleIcon, ExclamationTriangleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';
import type { ReactNode } from 'react';

export type SnackbarStatus = 'success' | 'alert' | 'warning';

const STATUS_STYLES: Record<SnackbarStatus, { border: string; icon: string; Icon: typeof CheckCircleIcon }> = {
  success: { border: 'border-success', icon: 'text-success', Icon: CheckCircleIcon },
  alert: { border: 'border-alert', icon: 'text-alert', Icon: XCircleIcon },
  warning: { border: 'border-warning', icon: 'text-warning', Icon: ExclamationTriangleIcon },
};

export interface SnackbarProps {
  status: SnackbarStatus;
  children: ReactNode;
  /** Shows a close button when given. */
  onClose?: () => void;
  className?: string;
}

// The guide's snackbar: a white card with a coloured edge and a status icon. Success is announced politely
// (role="status"), the others at once (role="alert").
export function Snackbar({ status, children, onClose, className = '' }: SnackbarProps): React.JSX.Element {
  const { border, icon, Icon } = STATUS_STYLES[status];

  return (
    <div
      role={status === 'success' ? 'status' : 'alert'}
      className={`flex items-center gap-3 rounded-md border-l-4 bg-surface/80 p-4 shadow-raised ${border} ${className}`}
    >
      <Icon className={`size-8 shrink-0 ${icon}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-content-1 text-text [overflow-wrap:anywhere]">{children}</p>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="shrink-0 rounded-full text-text">
          <XMarkIcon className="size-6" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
