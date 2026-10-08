import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { resolveTemplatesRoot } from '../src/core/paths.js';

// The sample "Design guide" page shows the HHS style guide from a data file, one copy in each frontend. These
// tests keep the two copies the same, and keep what the data says (colours, type scale) true to the design tokens.
const templatesRoot = resolveTemplatesRoot();
const reactData = path.join(templatesRoot, 'frontend/react/template/src/lib/design-guide.ts');
const angularData = path.join(templatesRoot, 'frontend/angular/template/src/app/core/design-guide.ts');

interface GuideData {
  TYPE_SCALE: Array<{ token: string; font: string; weight: string; size: number; lineHeight: number }>;
  COLOR_GROUPS: Array<{ swatches: Array<{ name: string; token: string; hex: string }> }>;
  COLOR_SYSTEM: Array<{ title: string; colors: Array<{ token: string; hex: string }> }>;
  GRADIENTS: Array<[string, string]>;
}

/** The `--name: value;` lines of tokens.css (comments left out). */
async function readTokens(): Promise<Map<string, string>> {
  const css = (await fs.readFile(path.join(templatesRoot, 'shared/design-tokens/tokens.css'), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  return new Map([...css.matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

/** What a token is, with `var(--other)` followed to the end. */
function resolve(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  if (value === undefined) throw new Error(`tokens.css has no --${name}`);
  const reference = /^var\(--([a-z0-9-]+)\)$/.exec(value);
  return reference ? resolve(tokens, reference[1]) : value;
}

const load = (file: string): Promise<GuideData> => import(pathToFileURL(file).href) as Promise<GuideData>;

describe('design guide data', () => {
  it('is the same file in the React and Angular templates', async () => {
    expect(await fs.readFile(angularData, 'utf8')).toBe(await fs.readFile(reactData, 'utf8'));
  });

  it('lists the colours of tokens.css, with the same values', async () => {
    const tokens = await readTokens();
    const { COLOR_GROUPS, COLOR_SYSTEM, GRADIENTS } = await load(reactData);

    for (const swatch of COLOR_GROUPS.flatMap((group) => group.swatches)) {
      const value = resolve(tokens, swatch.token.replace(/^--/, ''));
      if (swatch.token.startsWith('--gradient')) {
        // "#003087 - #005CB9" is the two ends of the gradient.
        for (const end of swatch.hex.split(' - ')) expect(value.toLowerCase(), `${swatch.name} gradient`).toContain(end.toLowerCase());
      } else {
        expect(value.toLowerCase(), `${swatch.name} (${swatch.token})`).toBe(swatch.hex.toLowerCase());
      }
    }

    for (const color of COLOR_SYSTEM.flatMap((palette) => palette.colors)) {
      expect(resolve(tokens, `color-${color.token}`).toLowerCase(), `--color-${color.token}`).toBe(color.hex.toLowerCase());
    }

    expect(GRADIENTS.length).toBeGreaterThan(0);
    for (const [from, to] of GRADIENTS) {
      expect(from).toMatch(/^#[0-9a-f]{6}$/);
      expect(to).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('lists the type scale of tokens.css, with the same sizes and weights', async () => {
    const tokens = await readTokens();
    const { TYPE_SCALE } = await load(reactData);
    const WEIGHTS: Record<string, string> = { Regular: '400', Medium: '500', Bold: '700' };
    const px = (rem: string): number => Number.parseFloat(rem) * 16;

    expect(TYPE_SCALE.map((style) => style.token)).toEqual(['h1', 'h2', 'h3', 'h4', 'content-1', 'content-2', 'content-3', 'content-4']);
    for (const style of TYPE_SCALE) {
      expect(px(resolve(tokens, `font-size-${style.token}`)), `${style.token} size`).toBe(style.size);
      expect(px(resolve(tokens, `line-height-${style.token}`)), `${style.token} line height`).toBe(style.lineHeight);
      expect(resolve(tokens, `font-weight-${style.token}`), `${style.token} weight`).toBe(WEIGHTS[style.weight]);
      // The titles are Roboto; everything else is Fira Sans.
      expect(style.font).toBe(style.token === 'h1' || style.token === 'h2' ? 'Roboto' : 'Fira Sans');
    }
    expect(resolve(tokens, 'font-title')).toContain('Roboto');
    expect(resolve(tokens, 'font-body')).toContain('Fira Sans');
  });
});
