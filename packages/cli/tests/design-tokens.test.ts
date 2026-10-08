import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveTemplatesRoot } from '../src/core/paths.js';

// The design tokens exist three times over: tokens.css (the source), tokens.json (for code that reads JSON,
// like the Material UI theme) and tailwind-theme.css (for Tailwind). Nothing generates one from another, so
// these tests are what keeps them from drifting apart.
const tokensDir = path.join(resolveTemplatesRoot(), 'shared', 'design-tokens');

const readTokenFile = (name: string): Promise<string> => fs.readFile(path.join(tokensDir, name), 'utf8');
const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
const camelCase = (name: string): string => name.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());

/** The `--name: value;` lines of tokens.css, with a value that is just another token (`var(--x)`) replaced by that token's value. */
function parseTokensCss(css: string): Map<string, string> {
  const raw = new Map<string, string>();
  for (const match of withoutComments(css).matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    raw.set(match[1], match[2].trim());
  }

  const resolve = (value: string, seen: string[] = []): string => {
    const reference = /^var\(--([a-z0-9-]+)\)$/.exec(value);
    if (!reference) return value;
    const target = raw.get(reference[1]);
    if (target === undefined || seen.includes(reference[1])) throw new Error(`tokens.css: --${reference[1]} is not defined (or loops)`);
    return resolve(target, [...seen, reference[1]]);
  };
  return new Map([...raw].map(([name, value]) => [name, resolve(value)]));
}

/** Where a token of tokens.css lives in tokens.json: `--color-base-darkest` is `color.baseDarkest`, `--font-size-h1` is `typography.fontSizeH1`. */
function jsonPath(name: string): [group: string, key: string] {
  if (name === 'header-height' || name === 'sidebar-width') return ['layout', camelCase(name)];

  const [first, ...rest] = name.split('-');
  const key = camelCase(rest.join('-'));
  switch (first) {
    case 'color':
    case 'gradient':
    case 'radius':
    case 'spacing':
    case 'shadow':
      return [first, key];
    case 'breakpoint':
      return ['breakpoints', key];
    case 'font':
    case 'line':
      return ['typography', camelCase(name)];
    default:
      throw new Error(`tokens.css: don't know where "--${name}" belongs in tokens.json (see jsonPath in design-tokens.test.ts)`);
  }
}

describe('design tokens', () => {
  it('tokens.json holds exactly the values of tokens.css', async () => {
    const css = parseTokensCss(await readTokenFile('tokens.css'));
    const json = JSON.parse(await readTokenFile('tokens.json')) as Record<string, Record<string, string | number>>;

    const expected = new Map<string, string>();
    for (const [name, value] of css) {
      const [group, key] = jsonPath(name);
      expected.set(`${group}.${key}`, value);
    }

    const actual = new Map<string, string>();
    for (const [group, entries] of Object.entries(json)) {
      for (const [key, value] of Object.entries(entries)) actual.set(`${group}.${key}`, String(value));
    }

    expect([...actual.keys()].sort(), 'tokens.json has different tokens than tokens.css').toEqual([...expected.keys()].sort());
    for (const [path, value] of expected) {
      expect(actual.get(path), `tokens.json ${path}`).toBe(value);
    }
  });

  it('tailwind-theme.css points every colour, radius, shadow and type-scale token at a token that exists', async () => {
    const css = parseTokensCss(await readTokenFile('tokens.css'));
    const theme = withoutComments(await readTokenFile('tailwind-theme.css'));
    const themeBlock = /@theme inline\s*\{([\s\S]*?)\n\}/.exec(theme)?.[1];
    expect(themeBlock, 'tailwind-theme.css has no "@theme inline" block').toBeDefined();

    const mapped = new Map<string, string>(); // Tailwind name -> the token it reads
    for (const match of (themeBlock ?? '').matchAll(/--([a-z0-9-]+)\s*:\s*var\(--([a-z0-9-]+)\)\s*;/g)) {
      mapped.set(match[1], match[2]);
      expect(css.has(match[2]), `tailwind-theme.css: --${match[1]} reads --${match[2]}, which tokens.css does not define`).toBe(true);
    }

    for (const name of css.keys()) {
      // Same name in both: colours, radii and shadows. The type scale becomes `--text-*`, the body font `--font-sans`.
      if (/^(color|radius|shadow)-/.test(name)) {
        expect(mapped.get(name), `tailwind-theme.css should map --${name}`).toBe(name);
      }
      const size = /^font-size-(.+)$/.exec(name);
      if (size) {
        expect(mapped.get(`text-${size[1]}`), `tailwind-theme.css should map --font-size-${size[1]} to --text-${size[1]}`).toBe(name);
        expect(mapped.get(`text-${size[1]}--line-height`)).toBe(`line-height-${size[1]}`);
        expect(mapped.get(`text-${size[1]}--font-weight`)).toBe(`font-weight-${size[1]}`);
      }
    }
    expect(mapped.get('font-title')).toBe('font-title');
    expect(mapped.get('font-sans')).toBe('font-body');
  });

  it('the spacing, layout and breakpoint tokens Tailwind gets from its own defaults agree with them', async () => {
    // Tailwind's responsive variants are fixed at build time (see tailwind-theme.css), so tokens.css has to match its defaults.
    const css = parseTokensCss(await readTokenFile('tokens.css'));
    expect(css.get('breakpoint-sm')).toBe('640px');
    expect(css.get('breakpoint-md')).toBe('768px');
    expect(css.get('breakpoint-lg')).toBe('1024px');
    expect(css.get('breakpoint-xl')).toBe('1280px');
  });
});
