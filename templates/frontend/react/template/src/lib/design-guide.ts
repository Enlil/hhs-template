// What the sample "Design guide" page shows: the HHS-approved TEDS UX / UI style
// guide, as data. The colours are the ones in src/styles/tokens.css (a test
// checks they agree); the names and wording are the guide's own.

export interface TypeStyle {
  /** What the guide calls it. */
  name: string;
  /** The end of the token names: `h1` is `--font-size-h1`, `--line-height-h1` and `--font-weight-h1`. */
  token: string;
  font: 'Roboto' | 'Fira Sans';
  weight: 'Bold' | 'Medium' | 'Regular';
  /** In pixels. */
  size: number;
  lineHeight: number;
}

export const TYPE_SCALE: TypeStyle[] = [
  { name: 'h1', token: 'h1', font: 'Roboto', weight: 'Bold', size: 24, lineHeight: 32 },
  { name: 'h2', token: 'h2', font: 'Roboto', weight: 'Bold', size: 20, lineHeight: 28 },
  { name: 'h3', token: 'h3', font: 'Fira Sans', weight: 'Medium', size: 20, lineHeight: 28 },
  { name: 'h4', token: 'h4', font: 'Fira Sans', weight: 'Medium', size: 16, lineHeight: 24 },
  { name: 'Content 1', token: 'content-1', font: 'Fira Sans', weight: 'Regular', size: 16, lineHeight: 24 },
  { name: 'Content 2', token: 'content-2', font: 'Fira Sans', weight: 'Medium', size: 14, lineHeight: 20 },
  { name: 'Content 3', token: 'content-3', font: 'Fira Sans', weight: 'Regular', size: 14, lineHeight: 20 },
  { name: 'Content 4', token: 'content-4', font: 'Fira Sans', weight: 'Regular', size: 12, lineHeight: 16 },
];

export interface Swatch {
  name: string;
  /** The CSS variable in tokens.css that holds the colour. */
  token: string;
  /** What the guide shows under the name. */
  hex: string;
}

export interface SwatchGroup {
  title: string;
  note: string;
  swatches: Swatch[];
}

// The guide's "Colors" page.
export const COLOR_GROUPS: SwatchGroup[] = [
  {
    title: 'Content',
    note: 'Text, icons etc',
    swatches: [
      { name: 'High', token: '--color-text', hex: '#1B1B1B' },
      { name: 'Medium', token: '--color-muted', hex: '#3D4551' },
      { name: 'Low', token: '--color-subtle', hex: '#71767A' },
    ],
  },
  {
    title: 'Accent',
    note: 'Primary',
    swatches: [
      { name: 'BG Linear', token: '--gradient-primary', hex: '#003087 - #005CB9' },
      { name: 'Primary', token: '--color-primary', hex: '#005EA2' },
      { name: 'Primary - Light', token: '--color-primary-lighter', hex: '#D9E8F6' },
    ],
  },
  {
    title: 'Status',
    note: 'Success, alert, warning',
    swatches: [
      { name: 'Success', token: '--color-success', hex: '#00A398' },
      { name: 'Alert', token: '--color-alert', hex: '#E41D3D' },
      { name: 'Warning', token: '--color-warning', hex: '#E5A000' },
    ],
  },
];

export interface PaletteColor {
  /** The guide's (USWDS) token name: `base-darkest` is the variable `--color-base-darkest`. */
  token: string;
  hex: string;
  /** Where the guide uses it. */
  use: string;
}

export interface Palette {
  title: string;
  note?: string;
  colors: PaletteColor[];
}

// The guide's "Color System" tables.
export const COLOR_SYSTEM: Palette[] = [
  {
    title: 'Base',
    colors: [
      { token: 'base-darkest', hex: '#1b1b1b', use: 'Text (alerts, body, buttons, input placeholder)' },
      { token: 'base-darker', hex: '#3d4551', use: 'Facet terms, tags' },
      { token: 'base-dark', hex: '#565c65', use: 'Backgrounds' },
      { token: 'base', hex: '#71767a', use: 'Backgrounds' },
      { token: 'base-light', hex: '#a9aeb1', use: 'Borders, box shadows' },
      { token: 'base-lighter', hex: '#dfe1e2', use: 'Backgrounds, table heads' },
      { token: 'base-lightest', hex: '#f0f0f0', use: 'Backgrounds, borders' },
    ],
  },
  {
    title: 'Primary',
    colors: [
      { token: 'primary-darker', hex: '#162e51', use: 'Header, footer, primary navigation' },
      { token: 'primary-dark', hex: '#1a4480', use: 'Backgrounds, borders' },
      { token: 'primary-vivid', hex: '#0050d8', use: 'Button hover and focus states, links' },
      { token: 'primary', hex: '#005ea2', use: 'Backgrounds, borders, buttons, link hover and focus states' },
      { token: 'primary-light', hex: '#73b3e7', use: 'Borders' },
      { token: 'primary-lighter', hex: '#d9e8f6', use: 'Low-level alerts' },
    ],
  },
  {
    title: 'Secondary',
    note: 'Frequently used with the primary palette colors, but in lesser amounts.',
    colors: [
      { token: 'secondary-darker', hex: '#8b0a03', use: 'Backgrounds, borders' },
      { token: 'secondary-dark', hex: '#b50909', use: 'Borders' },
      { token: 'secondary-vivid', hex: '#e41d3d', use: 'Backgrounds' },
      { token: 'secondary-light', hex: '#f2938c', use: 'High-level alerts' },
      { token: 'gold-30v', hex: '#e5a000', use: 'Borders' },
      { token: 'gold-20v', hex: '#ffbe2e', use: 'Backgrounds, borders' },
      { token: 'yellow-20v', hex: '#face00', use: 'Buttons' },
      { token: 'yellow-10v', hex: '#fee685', use: 'Medium-level alerts' },
    ],
  },
  {
    title: 'Tertiary',
    note: 'Sometimes used with the primary palette colors, but in lesser amounts.',
    colors: [
      { token: 'yellow-30v', hex: '#ddaa01', use: 'Backgrounds, borders' },
      { token: 'magenta-70v', hex: '#5c1111', use: 'Backgrounds, borders' },
      { token: 'mint-cool-40v', hex: '#00a398', use: 'Backgrounds, borders' },
      { token: 'green-cool-40v', hex: '#6cc24a', use: 'Backgrounds, borders' },
    ],
  },
];

// The guide's "Color Gradients" table: each pair runs from the first colour to the second.
export const GRADIENTS: Array<[string, string]> = [
  ['#003087', '#005cb9'],
  ['#003087', '#00b3e3'],
  ['#005cb9', '#6dabe4'],
  ['#005cb9', '#00b3e3'],
  ['#651c32', '#ab2328'],
  ['#ab2328', '#d22730'],
  ['#b47e00', '#ffc800'],
  ['#00a499', '#6cc24a'],
];
