import { alpha, createTheme, darken } from '@mui/material/styles';
import tokens from './styles/tokens.json';

// The shared design tokens (src/styles/tokens.json), turned into a Material UI
// theme: the HHS-approved style guide's colours, fonts, type scale and shapes.
// Change a value there and every component follows.
const { color, font, radius, shadow } = {
  color: tokens.color,
  font: tokens.typography,
  radius: tokens.radius,
  shadow: tokens.shadow,
};
const px = (value: string): number => Number.parseInt(value, 10);

type TypeStep = 'H1' | 'H2' | 'H3' | 'H4' | 'Content1' | 'Content2' | 'Content3' | 'Content4';

/** One step of the guide's type scale (h1 and h2 are in the title font, the rest in the body font). */
function textStyle(step: TypeStep, family: string = font.fontBody) {
  return {
    fontFamily: family,
    fontSize: font[`fontSize${step}`],
    lineHeight: font[`lineHeight${step}`],
    fontWeight: font[`fontWeight${step}`],
    letterSpacing: 'normal',
  };
}

/** The ring around whatever has keyboard focus. */
export const focusRing = { outline: `2px solid ${color.primaryVivid}`, outlineOffset: 2 };

/** A translucent white panel, like the guide's cards, for `sx`: `sx={{ ...glass, borderRadius: 1 }}`. */
export const glass = {
  backgroundColor: alpha(color.surface, 0.6),
  border: `1px solid ${alpha(color.surface, 0.7)}`,
  backdropFilter: 'blur(12px)',
};

export const theme = createTheme({
  palette: {
    primary: { main: color.primary, light: color.primaryLight, dark: color.primaryDark, contrastText: color.primaryForeground },
    // The guide's "secondary" button is a light blue one with blue text.
    secondary: { main: color.primaryLighter, contrastText: color.primary },
    error: { main: color.alert, light: color.secondaryLight, dark: color.secondaryDark },
    warning: { main: color.warning, contrastText: color.text },
    success: { main: color.success },
    info: { main: color.primaryVivid },
    background: { default: color.background, paper: color.surface },
    text: { primary: color.text, secondary: color.muted, disabled: color.subtle },
    divider: color.border,
  },
  // The shared breakpoints (sm = 640px, ...), so every look of this starter collapses at the same widths.
  breakpoints: {
    values: {
      xs: 0,
      sm: px(tokens.breakpoints.sm),
      md: px(tokens.breakpoints.md),
      lg: px(tokens.breakpoints.lg),
      xl: px(tokens.breakpoints.xl),
    },
  },
  shape: { borderRadius: px(radius.md) },
  typography: {
    fontFamily: font.fontBody,
    h1: textStyle('H1', font.fontTitle),
    h2: textStyle('H2', font.fontTitle),
    h3: textStyle('H3'),
    h4: textStyle('H4'),
    h5: textStyle('H4'),
    h6: textStyle('H4'),
    subtitle1: textStyle('Content1'),
    subtitle2: textStyle('Content2'),
    body1: textStyle('Content1'),
    body2: textStyle('Content3'),
    caption: textStyle('Content4'),
    overline: { ...textStyle('Content4'), textTransform: 'none' },
    button: { ...textStyle('Content1'), textTransform: 'none' },
  },
  components: {
    // The guide's buttons: pills, filled blue (primary), light blue (secondary), or outlined (tertiary).
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: px(radius.pill),
          padding: '16px 32px',
          gap: 8,
          '&.Mui-focusVisible': focusRing,
        },
        sizeSmall: { padding: '8px 20px', ...textStyle('Content3') },
      },
      variants: [
        { props: { variant: 'contained', color: 'primary' }, style: { '&:hover': { backgroundColor: color.primaryVivid } } },
        {
          props: { variant: 'contained', color: 'secondary' },
          style: { '&:hover': { backgroundColor: darken(color.primaryLighter, 0.06) } },
        },
        {
          props: { variant: 'outlined', color: 'primary' },
          style: { borderColor: color.primary, '&:hover': { borderColor: color.primary, backgroundColor: color.primaryLighter } },
        },
      ],
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { ...glass, borderRadius: px(radius.md) } },
    },
    // The guide's fields: a white pill (a rounded box for several lines) with no border; focus shows a ring.
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: px(radius.xl),
          backgroundColor: color.surface,
          '& .MuiOutlinedInput-notchedOutline, &:hover .MuiOutlinedInput-notchedOutline, &.Mui-focused .MuiOutlinedInput-notchedOutline':
            { border: 'none' },
          '&.Mui-focused': focusRing,
          '&.Mui-error': { outline: `2px solid ${color.alert}` },
          '&.Mui-disabled': { opacity: 0.5 },
        },
        // With something before the value (the "$" of a price), the space comes from the field, not the text.
        adornedStart: { paddingLeft: 20 },
        input: {
          ...textStyle('Content3'),
          padding: '14px 20px',
          height: 'auto',
          '&.MuiInputBase-inputAdornedStart': { paddingLeft: 0 },
          '&::placeholder': { color: color.subtle, opacity: 1 },
        },
        multiline: { padding: 0 },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          ...textStyle('Content2'),
          marginBottom: 4,
          color: color.muted,
          '&.Mui-focused': { color: color.muted },
          '&.Mui-error': { color: color.alert },
        },
      },
    },
    // What goes before the value of a field, like the "$" of a price.
    MuiInputAdornment: {
      styleOverrides: { root: { ...textStyle('Content3'), color: color.subtle } },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { right: 20, width: 20, height: 20, top: 'calc(50% - 10px)', color: color.text },
      },
    },
    MuiMenu: {
      styleOverrides: { paper: { borderRadius: px(radius.md), boxShadow: shadow.raised } },
    },
    MuiMenuItem: {
      styleOverrides: { root: { ...textStyle('Content3') } },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: { marginLeft: 0, marginRight: 0, gap: 16 },
        label: textStyle('Content3'),
      },
    },
    MuiLink: {
      defaultProps: { underline: 'hover' },
      styleOverrides: { root: { color: color.primaryVivid } },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: { ...textStyle('Content3'), color: color.muted },
        separator: { marginLeft: 8, marginRight: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          ...textStyle('Content3'),
          height: 24,
          borderRadius: px(radius.sm),
          color: color.text,
          backgroundColor: alpha(color.surface, 0.5),
          border: `1px solid ${alpha(color.primary, 0.5)}`,
        },
        label: { padding: '0 8px' },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { ...textStyle('H2', font.fontTitle), backgroundColor: color.primaryLighter, color: color.primary },
      },
    },
    // The guide's tabs: Fira Sans Medium, with a 2px blue line under the one you are on.
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: `1px solid ${color.surface}` },
        indicator: { height: 2, backgroundColor: color.primary },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...textStyle('H4'),
          textTransform: 'none',
          minHeight: 56,
          padding: '16px 24px',
          color: color.text,
          '&.Mui-selected': { color: color.text },
          '&.Mui-focusVisible': focusRing,
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: color.surface,
          borderRadius: px(radius.pill),
          overflow: 'hidden',
          height: 44,
          // The group squares off the corners where its buttons meet; the guide's buttons stay round.
          '& .MuiToggleButtonGroup-grouped': { borderRadius: px(radius.pill), margin: 0, border: 0 },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          border: 'none',
          width: 44,
          padding: 12,
          borderRadius: px(radius.pill),
          color: color.text,
          '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: color.primary, color: color.primaryForeground },
          '&.Mui-focusVisible': focusRing,
        },
      },
    },
    // The guide's snackbar: a white card with a coloured edge. See components/Snackbar.tsx.
    MuiAlert: {
      styleOverrides: {
        root: {
          ...textStyle('Content1'),
          alignItems: 'center',
          padding: 16,
          gap: 12,
          color: color.text,
          backgroundColor: alpha(color.surface, 0.8),
          borderRadius: px(radius.md),
          borderLeftWidth: 4,
          borderLeftStyle: 'solid',
          boxShadow: shadow.raised,
          // The edge takes the colour of the status.
          '&.MuiAlert-colorSuccess': { borderLeftColor: color.success },
          '&.MuiAlert-colorError': { borderLeftColor: color.alert },
          '&.MuiAlert-colorWarning': { borderLeftColor: color.warning },
        },
        icon: { margin: 0, padding: 0, opacity: 1 },
        message: { flex: 1, minWidth: 0, padding: 0, overflowWrap: 'anywhere' },
        action: { margin: 0, padding: 0 },
      },
    },
    MuiDialog: {
      styleOverrides: { paper: { borderRadius: px(radius.lg), backgroundImage: 'none', boxShadow: shadow.raised } },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { ...textStyle('H2', font.fontTitle) } },
    },
    MuiTableHead: {
      styleOverrides: { root: { backgroundColor: color.baseLighter } },
    },
    MuiTableCell: {
      styleOverrides: { root: { ...textStyle('Content3'), borderBottom: 'none' } },
    },
  },
});
