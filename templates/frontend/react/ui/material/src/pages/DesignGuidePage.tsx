import {
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  Squares2X2Icon,
  SunIcon,
  SwatchIcon,
  UsersIcon,
  ViewColumnsIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import RadioGroup from '@mui/material/RadioGroup';
import { alpha } from '@mui/material/styles';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Checkbox } from '../components/Checkbox';
import { Field } from '../components/Field';
import { PillMenuItem } from '../components/PillMenuItem';
import { Radio } from '../components/Radio';
import { SearchField } from '../components/SearchField';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { SelectField } from '../components/SelectField';
import { Snackbar } from '../components/Snackbar';
import type { SnackbarStatus } from '../components/Snackbar';
import { Step } from '../components/Step';
import {
  COLOR_GROUPS,
  COLOR_SYSTEM,
  GRADIENTS,
  TYPE_SCALE,
} from '../lib/design-guide';
import type { Swatch } from '../lib/design-guide';
import { glass } from '../theme';

// A sample of the HHS-approved TEDS UX / UI style guide, made with this app's
// own theme and components, so what you see here is what your pages get.
// Everything on it comes from src/lib/design-guide.ts, src/theme.ts and src/components.

// How each step of the type scale is written in Material UI.
const TYPE_VARIANT = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  'content-1': 'body1',
  'content-2': 'subtitle2',
  'content-3': 'body2',
  'content-4': 'caption',
} as const;

const ICONS: Array<[name: string, Icon: typeof CheckIcon]> = [
  ['magnifying-glass', MagnifyingGlassIcon],
  ['chevron-down', ChevronDownIcon],
  ['chevron-right', ChevronRightIcon],
  ['check', CheckIcon],
  ['check-circle', CheckCircleIcon],
  ['x-circle', XCircleIcon],
  ['x-mark', XMarkIcon],
  ['exclamation-triangle', ExclamationTriangleIcon],
  ['sun', SunIcon],
  ['moon', MoonIcon],
  ['squares-2x2', Squares2X2Icon],
  ['view-columns', ViewColumnsIcon],
  ['document-text', DocumentTextIcon],
  ['users', UsersIcon],
  ['swatch', SwatchIcon],
];

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }): React.JSX.Element {
  return (
    <Box component="section" aria-labelledby={`${id}-title`} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box>
        <Typography id={`${id}-title`} variant="h2" component="h2">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Box>
      {children}
    </Box>
  );
}

// One titled panel of the page. `wide` makes it span the whole row of the grid.
function Demo({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <Card sx={{ gridColumn: wide ? { md: 'span 2', xl: 'span 3' } : undefined }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography variant="h3" component="h3">
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

const demoGrid = {
  display: 'grid',
  gap: 2,
  gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))', xl: 'repeat(3, minmax(0, 1fr))' },
};

function TypographySection(): React.JSX.Element {
  const rows = (styles: typeof TYPE_SCALE): React.JSX.Element[] =>
    styles.map((style) => (
      <Box
        key={style.token}
        sx={(theme) => ({ borderRadius: 1, px: 2.5, py: 2, bgcolor: alpha(theme.palette.text.primary, 0.08) })}
      >
        <Typography variant="h1" component="p">
          {style.name}
        </Typography>
        <Typography variant={TYPE_VARIANT[style.token as keyof typeof TYPE_VARIANT]} color="text.secondary" component="p">
          {style.font}, {style.size}, {style.weight}
        </Typography>
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
          {`variant="${TYPE_VARIANT[style.token as keyof typeof TYPE_VARIANT]}"`}
        </Typography>
      </Box>
    ));

  return (
    <Section
      id="typography"
      title="Typography"
      description="Roboto for titles and Fira Sans for content, both loaded from the app itself."
    >
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' } }}>
        <Demo title="Title">{rows(TYPE_SCALE.slice(0, 4))}</Demo>
        <Demo title="Content">{rows(TYPE_SCALE.slice(4))}</Demo>
      </Box>
    </Section>
  );
}

function SwatchCard({ name, token, hex }: Swatch): React.JSX.Element {
  return (
    <Card sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
      <Box sx={{ display: 'flex', width: 80, height: 80, flexShrink: 0, p: 1, borderRadius: '4px', bgcolor: 'background.paper' }}>
        <Box sx={{ width: '100%', height: '100%', borderRadius: '4px', background: `var(${token})` }} />
      </Box>
      <Box>
        <Typography variant="h2" component="p">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {hex}
        </Typography>
      </Box>
    </Card>
  );
}

function ColorsSection(): React.JSX.Element {
  return (
    <Section
      id="colors"
      title="Colors"
      description="The HHS color system. Text and background colors must still meet WCAG 2.0 AA contrast: check each pair."
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {COLOR_GROUPS.map((group) => (
          <Box key={group.title} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="h3" component="h3">
              {group.title}{' '}
              <Typography variant="body2" component="span" color="text.secondary">
                {group.note}
              </Typography>
            </Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(3, minmax(0, 1fr))' } }}>
              {group.swatches.map((swatch) => (
                <SwatchCard key={swatch.name} {...swatch} />
              ))}
            </Box>
          </Box>
        ))}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h3" component="h3">
            Color system
          </Typography>
          {COLOR_SYSTEM.map((palette) => (
            <TableContainer key={palette.title} sx={{ ...glass, borderRadius: 1 }}>
              <Table size="small">
                <Box component="caption" sx={{ px: 2, pt: 2, pb: 1, textAlign: 'left' }}>
                  <Typography variant="h2" component="span">
                    {palette.title}
                  </Typography>
                  {palette.note ? (
                    <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                      {palette.note}
                    </Typography>
                  ) : null}
                </Box>
                <TableHead>
                  <TableRow>
                    <TableCell>Color</TableCell>
                    <TableCell>Hex</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>Application</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {palette.colors.map((color) => (
                    <TableRow key={color.token} sx={{ '&:nth-of-type(odd)': { bgcolor: (theme) => alpha(theme.palette.background.paper, 0.4) } }}>
                      <TableCell>
                        <Box
                          aria-hidden="true"
                          sx={{ width: 32, height: 32, borderRadius: '4px', background: `var(--color-${color.token})` }}
                        />
                      </TableCell>
                      <TableCell>{color.hex}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{color.token}</TableCell>
                      <TableCell>{color.use}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="h3" component="h3">
            Gradients
          </Typography>
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
            {GRADIENTS.map(([from, to]) => (
              <Card key={`${from}-${to}`} sx={{ p: 1.5 }}>
                <Box sx={{ height: 48, borderRadius: '4px', background: `linear-gradient(90deg, ${from}, ${to})` }} />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {from} to {to}
                </Typography>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>
    </Section>
  );
}

function IconsSection(): React.JSX.Element {
  return (
    <Section
      id="icons"
      title="Icons"
      description="Heroicons, from the @heroicons/react package. Import the ones you need: import { CheckIcon } from '@heroicons/react/24/solid'."
    >
      <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' } }}>
        {ICONS.map(([name, Icon]) => (
          <Card key={name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
            <Icon width={24} height={24} aria-hidden="true" style={{ flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">
              {name}
            </Typography>
          </Card>
        ))}
      </Box>
    </Section>
  );
}

function ComponentsSection(): React.JSX.Element {
  const [tab, setTab] = useState('Active Tab');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [snackbars, setSnackbars] = useState<SnackbarStatus[]>(['success', 'alert']);
  const dismiss = (status: SnackbarStatus): void => setSnackbars((shown) => shown.filter((item) => item !== status));

  return (
    <Section
      id="components"
      title="Components"
      description="Material UI components, themed in src/theme.ts, plus the few in src/components: change them in one place."
    >
      <Box sx={demoGrid}>
        <Demo title="Input Field">
          <Field label="First Name" defaultValue="John" />
        </Demo>
        <Demo title="Textarea">
          <Field label="Other" placeholder="-" multiline minRows={3} />
        </Demo>
        <Demo title="Search">
          <SearchField fullWidth />
        </Demo>
        <Demo title="Select">
          <SelectField label="Relationship" defaultValue="">
            <MenuItem value="">-</MenuItem>
            <MenuItem value="parent">Parent</MenuItem>
            <MenuItem value="guardian">Guardian</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </SelectField>
        </Demo>
        <Demo title="Price Input">
          <Field
            label="Rent amount"
            defaultValue="900"
            inputProps={{ inputMode: 'numeric' }}
            startAdornment={<InputAdornment position="start">$</InputAdornment>}
          />
        </Demo>
        <Demo title="Tag">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {['Tag', 'Tag', 'Tag', 'Tag', 'Tag', 'Tag'].map((text, index) => (
              <Chip key={index} label={text} size="small" />
            ))}
          </Box>
        </Demo>
        <Demo title="Button" wide>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Button variant="contained">Primary Button</Button>
            <Button variant="contained" color="secondary">
              Secondary Button
            </Button>
            <Button variant="outlined">Tertiary Button</Button>
            <Button variant="contained" disabled>
              Disabled Button
            </Button>
          </Box>
        </Demo>
        <Demo title="Checkbox">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Checkbox label="Active Checkbox" defaultChecked />
            <Checkbox label="Inactive Checkbox" />
          </Box>
        </Demo>
        <Demo title="Radiobutton">
          <RadioGroup defaultValue="active" aria-label="Radio example" sx={{ gap: 2 }}>
            <Radio value="active" label="Active Radio" />
            <Radio value="inactive" label="Inactive Radio" />
          </RadioGroup>
        </Demo>
        <Demo title="Toggle">
          <SegmentedToggle
            label="Theme"
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light', icon: SunIcon },
              { value: 'dark', label: 'Dark', icon: MoonIcon },
            ]}
          />
          <Typography variant="caption" color="text.secondary">
            A sample only: this starter has no dark theme.
          </Typography>
        </Demo>
        <Demo title="Step" wide>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Step number={1} label="Active Step Name" active />
            <Step number={2} label="Inactive Step Name" />
          </Box>
        </Demo>
        <Demo title="Menu Item">
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <PillMenuItem label="Inactive Item" icon={Squares2X2Icon} />
            <PillMenuItem label="Active Item" icon={ViewColumnsIcon} active expandable />
          </Box>
        </Demo>
        <Demo title="Breadcrumb">
          <Breadcrumbs aria-label="Breadcrumb" separator={<ChevronRightIcon width={12} height={12} aria-hidden="true" />}>
            <Link component={RouterLink} to="/link-one" color="inherit">
              Applications
            </Link>
            <Typography component="span" aria-current="page" sx={{ font: 'inherit' }}>
              Capture Document
            </Typography>
          </Breadcrumbs>
        </Demo>
        <Demo title="Avatar">
          <Avatar role="img" aria-label="Jane Doe" sx={{ width: 56, height: 56 }}>
            JD
          </Avatar>
        </Demo>
        <Demo title="Tabs">
          <Tabs value={tab} onChange={(_event, next: string) => setTab(next)} aria-label="Example tabs">
            <Tab label="Active Tab" value="Active Tab" />
            <Tab label="Inactive Tab" value="Inactive Tab" />
          </Tabs>
          <Typography color="text.secondary" role="tabpanel">
            You are on the "{tab}" tab.
          </Typography>
        </Demo>
        <Demo title="Snackbar" wide>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {snackbars.includes('success') ? (
              <Snackbar status="success" onClose={() => dismiss('success')}>
                Image processing submitted successfully.
              </Snackbar>
            ) : null}
            {snackbars.includes('alert') ? (
              <Snackbar status="alert" onClose={() => dismiss('alert')}>
                Image processing submitted unsuccessfully.
              </Snackbar>
            ) : null}
            {snackbars.length < 2 ? (
              <Button variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => setSnackbars(['success', 'alert'])}>
                Show again
              </Button>
            ) : null}
          </Box>
        </Demo>
      </Box>
    </Section>
  );
}

export function DesignGuidePage(): React.JSX.Element {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <Box>
        <Typography variant="h1" component="h1">
          Design guide
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          A sample of the HHS-approved TEDS UX / UI style guide, built with this app&apos;s own colors, fonts and
          components.
        </Typography>
      </Box>
      <TypographySection />
      <ColorsSection />
      <IconsSection />
      <ComponentsSection />
    </Box>
  );
}
