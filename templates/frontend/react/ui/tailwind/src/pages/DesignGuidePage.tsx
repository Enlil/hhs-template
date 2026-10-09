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
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar } from '../components/Avatar';
import { Breadcrumb } from '../components/Breadcrumb';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Input } from '../components/Input';
import { MenuItem } from '../components/MenuItem';
import { Radio } from '../components/Radio';
import { SearchField } from '../components/SearchField';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { Select } from '../components/Select';
import { Snackbar } from '../components/Snackbar';
import type { SnackbarStatus } from '../components/Snackbar';
import { Step } from '../components/Step';
import { Tabs } from '../components/Tabs';
import { Tag } from '../components/Tag';
import { Textarea } from '../components/Textarea';
import {
  COLOR_GROUPS,
  COLOR_SYSTEM,
  GRADIENTS,
  TYPE_SCALE,
} from '../lib/design-guide';
import type { Swatch } from '../lib/design-guide';

// A sample of the HHS-approved TEDS UX / UI style guide, made with this app's
// own tokens and components, so what you see here is what your pages get.
// Everything on it comes from src/lib/design-guide.ts and src/components.

// How each step of the type scale is written in Tailwind. Whole class names, so Tailwind can find them.
const TYPE_CLASSES: Record<string, string> = {
  h1: 'font-title text-h1',
  h2: 'font-title text-h2',
  h3: 'text-h3',
  h4: 'text-h4',
  'content-1': 'text-content-1',
  'content-2': 'text-content-2',
  'content-3': 'text-content-3',
  'content-4': 'text-content-4',
};

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
    <section aria-labelledby={`${id}-title`} className="flex flex-col gap-4">
      <div>
        <h2 id={`${id}-title`}>{title}</h2>
        <p className="text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

// One titled panel of the page.
function Demo({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={`glass flex flex-col gap-4 rounded-md p-5 ${className}`}>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function TypographySection(): React.JSX.Element {
  const rows = (styles: typeof TYPE_SCALE): React.JSX.Element[] =>
    styles.map((style) => (
      <div key={style.token} className="rounded-md bg-text/8 px-5 py-4">
        <p className="font-title text-h1">{style.name}</p>
        <p className={`text-muted ${TYPE_CLASSES[style.token]}`}>
          {style.font}, {style.size}, {style.weight}
        </p>
        <p className="mt-1 text-content-4 text-muted">
          <code>{TYPE_CLASSES[style.token]}</code>
        </p>
      </div>
    ));

  return (
    <Section
      id="typography"
      title="Typography"
      description="Roboto for titles and Fira Sans for content, both loaded from the app itself."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Demo title="Title">{rows(TYPE_SCALE.slice(0, 4))}</Demo>
        <Demo title="Content">{rows(TYPE_SCALE.slice(4))}</Demo>
      </div>
    </Section>
  );
}

function SwatchCard({ name, token, hex }: Swatch): React.JSX.Element {
  return (
    <div className="glass flex items-center gap-4 rounded-md p-2">
      <span className="flex size-20 shrink-0 items-center justify-center rounded-sm bg-surface p-2">
        <span className="size-full rounded-sm" style={{ background: `var(${token})` }} />
      </span>
      <div>
        <p className="font-title text-h2">{name}</p>
        <p className="text-content-3 text-muted">{hex}</p>
      </div>
    </div>
  );
}

function ColorsSection(): React.JSX.Element {
  return (
    <Section
      id="colors"
      title="Colors"
      description="The HHS color system. Text and background colors must still meet WCAG 2.0 AA contrast: check each pair."
    >
      <div className="flex flex-col gap-6">
        {COLOR_GROUPS.map((group) => (
          <div key={group.title} className="flex flex-col gap-3">
            <h3>
              {group.title} <span className="text-content-3 font-normal text-muted">{group.note}</span>
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {group.swatches.map((swatch) => (
                <SwatchCard key={swatch.name} {...swatch} />
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          <h3>Color system</h3>
          {COLOR_SYSTEM.map((palette) => (
            <div key={palette.title} className="glass overflow-x-auto rounded-md">
              <table className="w-full text-left text-content-3">
                <caption className="px-4 pt-4 pb-2 text-left font-title text-h2">
                  {palette.title}
                  {palette.note ? <span className="ml-2 text-content-3 font-normal text-muted">{palette.note}</span> : null}
                </caption>
                <thead className="bg-base-lighter">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Color
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Hex
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Token
                    </th>
                    <th scope="col" className="px-4 py-2 font-medium">
                      Application
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {palette.colors.map((color) => (
                    <tr key={color.token} className="odd:bg-surface/40">
                      <td className="px-4 py-2">
                        <span
                          className="block size-8 rounded-sm"
                          style={{ background: `var(--color-${color.token})` }}
                          aria-hidden="true"
                        />
                      </td>
                      <td className="px-4 py-2">{color.hex}</td>
                      <td className="px-4 py-2">
                        <code>{color.token}</code>
                      </td>
                      <td className="px-4 py-2">{color.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h3>Gradients</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {GRADIENTS.map(([from, to]) => (
              <div key={`${from}-${to}`} className="glass rounded-md p-3">
                <div className="h-12 rounded-sm" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} />
                <p className="mt-2 text-content-3 text-muted">
                  {from} to {to}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {ICONS.map(([name, Icon]) => (
          <div key={name} className="glass flex items-center gap-3 rounded-md px-4 py-3">
            <Icon className="size-6 shrink-0 text-text" aria-hidden="true" />
            <span className="text-content-3 text-muted">{name}</span>
          </div>
        ))}
      </div>
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
      description="Every piece below is a component in src/components: use them as they are, or change them in one place."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Demo title="Input Field">
          <Input label="First Name" defaultValue="John" />
        </Demo>
        <Demo title="Textarea">
          <Textarea label="Other" placeholder="-" />
        </Demo>
        <Demo title="Search">
          <SearchField className="w-full" />
        </Demo>
        <Demo title="Select">
          <Select label="Relationship" defaultValue="">
            <option value="">-</option>
            <option>Parent</option>
            <option>Guardian</option>
            <option>Other</option>
          </Select>
        </Demo>
        <Demo title="Price Input">
          <Input label="Rent amount" startAdornment="$" defaultValue="900" inputMode="numeric" />
        </Demo>
        <Demo title="Tag">
          <div className="flex flex-wrap gap-1">
            {['Tag', 'Tag', 'Tag', 'Tag', 'Tag', 'Tag'].map((text, index) => (
              <Tag key={index}>{text}</Tag>
            ))}
          </div>
        </Demo>
        <Demo title="Button" className="md:col-span-2 xl:col-span-3">
          <div className="flex flex-wrap gap-2">
            <Button>Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="tertiary">Tertiary Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
        </Demo>
        <Demo title="Checkbox">
          <div className="flex flex-col gap-4">
            <Checkbox label="Active Checkbox" defaultChecked />
            <Checkbox label="Inactive Checkbox" />
          </div>
        </Demo>
        <Demo title="Radiobutton">
          <div className="flex flex-col gap-4">
            <Radio name="radio-example" label="Active Radio" defaultChecked />
            <Radio name="radio-example" label="Inactive Radio" />
          </div>
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
          <p className="text-content-4 text-muted">A sample only: this starter has no dark theme.</p>
        </Demo>
        <Demo title="Step" className="md:col-span-2 xl:col-span-3">
          <div className="flex flex-wrap gap-3">
            <Step number={1} label="Active Step Name" active />
            <Step number={2} label="Inactive Step Name" />
          </div>
        </Demo>
        <Demo title="Menu Item">
          <div className="flex flex-wrap gap-3">
            <MenuItem label="Inactive Item" icon={Squares2X2Icon} />
            <MenuItem label="Active Item" icon={ViewColumnsIcon} active expandable />
          </div>
        </Demo>
        <Demo title="Breadcrumb">
          <Breadcrumb items={[{ label: 'Applications', to: '/link-one' }, { label: 'Capture Document' }]} />
        </Demo>
        <Demo title="Avatar">
          <Avatar name="Jane Doe" />
        </Demo>
        <Demo title="Tabs">
          <Tabs label="Example tabs" tabs={['Active Tab', 'Inactive Tab']} value={tab} onChange={setTab} />
          <p role="tabpanel" className="text-muted">
            You are on the "{tab}" tab.
          </p>
        </Demo>
        <Demo title="Snackbar" className="md:col-span-2">
          <div className="flex flex-col gap-3">
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
              <Button variant="tertiary" className="self-start" onClick={() => setSnackbars(['success', 'alert'])}>
                Show again
              </Button>
            ) : null}
          </div>
        </Demo>
      </div>
    </Section>
  );
}

export function DesignGuidePage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1>Design guide</h1>
        <p className="mt-1 text-muted">
          A sample of the HHS-approved TEDS UX / UI style guide, built with this app&apos;s own colors, fonts and
          components.
        </p>
      </div>
      <TypographySection />
      <ColorsSection />
      <IconsSection />
      <ComponentsSection />
    </div>
  );
}
