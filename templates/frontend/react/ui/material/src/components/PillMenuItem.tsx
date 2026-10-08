import { ChevronDownIcon } from '@heroicons/react/24/solid';
import ButtonBase from '@mui/material/ButtonBase';
import { alpha } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ComponentType } from 'react';
import { focusRing } from '../theme';

// The look of one menu item, shared by <PillMenuItem> and the sidebar (whose items are links): a pill,
// filled blue for the page you are on. NavLink gives the current link the class "active".
export const pillMenuItemSx: SxProps<Theme> = (theme) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 1.5,
  p: '14px',
  borderRadius: '9999px',
  typography: 'body2',
  color: 'text.primary',
  backgroundColor: alpha(theme.palette.background.paper, 0.6),
  '&:hover': { backgroundColor: alpha(theme.palette.background.paper, 0.8) },
  '&.Mui-focusVisible': focusRing,
  '&.active, &[aria-current="page"]': {
    color: 'primary.contrastText',
    backgroundColor: 'primary.main',
    '&:hover': { backgroundColor: 'primary.main' },
  },
});

export interface PillMenuItemProps {
  label: string;
  icon?: ComponentType<{ width?: number; height?: number }>;
  active?: boolean;
  /** Shows a chevron, for an item that opens a submenu. */
  expandable?: boolean;
  onClick?: () => void;
}

// Named "PillMenuItem" so it is not mixed up with MUI's own <MenuItem>, which is for the options of a menu.
export function PillMenuItem({ label, icon: Icon, active = false, expandable = false, onClick }: PillMenuItemProps): React.JSX.Element {
  return (
    <ButtonBase aria-current={active ? 'page' : undefined} onClick={onClick} sx={pillMenuItemSx}>
      {Icon ? <Icon width={20} height={20} /> : null}
      {label}
      {expandable ? <ChevronDownIcon width={20} height={20} aria-hidden="true" /> : null}
    </ButtonBase>
  );
}
