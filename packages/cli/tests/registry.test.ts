import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveTemplatesRoot } from '../src/core/paths.js';
import { backendRegistry, frontendRegistry, optionGroups } from '../src/registry/index.js';
import type { FrontendId } from '../src/registry/types.js';
import { listFilesRecursive } from './helpers.js';

// What a CSS-framework folder must provide for each frontend: the template's shared files
// (App.tsx, app.routes.ts, index.html, ...) import these by path, and nothing else supplies them.
const LAYER_CONTRACT: Record<FrontendId, string[]> = {
  react: [
    'README.md',
    'src/main.tsx',
    'src/components/AppShell.tsx',
    'src/pages/LoginPage.tsx',
    'src/pages/DashboardPage.tsx',
    'src/pages/DesignGuidePage.tsx',
    'src/pages/PlaceholderPage.tsx',
  ],
  angular: [
    'README.md',
    'src/styles.css',
    'src/app/shell/app-shell/app-shell.component.ts',
    'src/app/pages/login/login.component.ts',
    'src/app/pages/dashboard/dashboard.component.ts',
    'src/app/pages/design-guide/design-guide.component.ts',
    'src/app/pages/placeholder/placeholder.component.ts',
  ],
};

const TEXT_FILE = /\.(ts|tsx|js|json|html|css|scss|md|yml|yaml|xml|svg|txt)$/i;

describe('template registry', () => {
  it('every frontend template dir exists on disk', () => {
    for (const template of Object.values(frontendRegistry)) {
      expect(existsSync(template.templateDir), template.templateDir).toBe(true);
    }
  });

  it('every backend template dir exists on disk', () => {
    for (const template of Object.values(backendRegistry)) {
      expect(existsSync(template.templateDir), template.templateDir).toBe(true);
    }
  });

  it('exposes exactly the documented frontend and backend ids', () => {
    expect(Object.keys(frontendRegistry).sort()).toEqual(['angular', 'react']);
    expect(Object.keys(backendRegistry).sort()).toEqual(['dotnet', 'node', 'springboot']);
  });

  it('every registry entry\'s id matches its own key', () => {
    for (const [key, template] of Object.entries(frontendRegistry)) {
      expect(template.id).toBe(key);
    }
    for (const [key, template] of Object.entries(backendRegistry)) {
      expect(template.id).toBe(key);
    }
  });
});

describe('template options', () => {
  it('option ids are kebab-case; one id on several templates is one option, defined identically', () => {
    const groups = optionGroups(); // throws if two templates define the same id differently

    expect(groups.length).toBeGreaterThan(0);
    for (const { option } of groups) {
      expect(option.id, `option id "${option.id}"`).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }

    // The CSS framework is offered by both frontends, as a single shared definition.
    const cssFramework = groups.find((group) => group.option.id === 'css-framework');
    expect(cssFramework?.owners.map((owner) => owner.id)).toEqual(['react', 'angular']);
    expect(frontendRegistry.react.options?.[0]).toBe(frontendRegistry.angular.options?.[0]);
  });

  it('every option says what kind it is', () => {
    for (const { option } of optionGroups()) {
      expect(['toggle', 'choice'], `option "${option.id}"`).toContain(option.kind);
    }
  });

  it('every choice option has something to choose between, and a default that is one of the choices', () => {
    const choiceOptions = optionGroups().flatMap(({ option }) => (option.kind === 'choice' ? [option] : []));
    expect(choiceOptions.length).toBeGreaterThan(0);

    for (const option of choiceOptions) {
      const values = option.choices.map((choice) => choice.value);

      expect(values.length, `"${option.id}" has fewer than two choices`).toBeGreaterThan(1);
      expect(new Set(values).size, `"${option.id}" repeats a value`).toBe(values.length);
      expect(values, `the default of "${option.id}"`).toContain(option.default);
      for (const choice of option.choices) {
        expect(choice.value, `a value of "${option.id}"`).not.toBe('');
        expect(choice.label, `a label of "${option.id}"`).not.toBe('');
      }
    }
  });
});

describe('template layers (one folder of files per choice, e.g. per CSS framework)', () => {
  const templatesWithLayers = [...Object.values(frontendRegistry), ...Object.values(backendRegistry)].filter(
    (template) => template.layers,
  );

  it('the frontends have a folder for each CSS framework', () => {
    expect(templatesWithLayers.map((template) => template.id).sort()).toEqual(['angular', 'react']);
  });

  it('every layered option is a choice the template offers, with a layer for each choice and none extra', () => {
    for (const template of templatesWithLayers) {
      for (const [optionId, layers] of Object.entries(template.layers ?? {})) {
        const option = template.options?.find((candidate) => candidate.id === optionId);
        expect(option?.kind, `${template.id}: "${optionId}" must be a choice option it offers`).toBe('choice');
        if (option?.kind !== 'choice') continue;

        expect(Object.keys(layers).sort(), `${template.id}: layers for "${optionId}"`).toEqual(
          option.choices.map((choice) => choice.value).sort(),
        );
      }
    }
  });

  it('every layer folder exists, provides what the shared files import, and lists token files that exist', async () => {
    const tokenFilesOnDisk = await fs.readdir(path.join(resolveTemplatesRoot(), 'shared', 'design-tokens'));

    for (const template of templatesWithLayers) {
      for (const [optionId, layers] of Object.entries(template.layers ?? {})) {
        for (const [choice, layer] of Object.entries(layers)) {
          const label = `${template.id} / ${optionId}=${choice}`;

          expect(existsSync(layer.dir), `${label}: ${layer.dir}`).toBe(true);
          const files = await listFilesRecursive(layer.dir);
          for (const required of LAYER_CONTRACT[template.id as FrontendId]) {
            expect(files, `${label} is missing ${required}`).toContain(required);
          }
          for (const tokenFile of layer.tokenFiles) {
            expect(tokenFilesOnDisk, `${label} lists a token file that does not exist`).toContain(tokenFile);
          }
        }
      }
    }
  });

  it("a layer's package.json only adds packages: it is merged into the template's, which has the name and scripts", async () => {
    // Were it copied as it is, the project would have a half-empty package.json.
    for (const template of templatesWithLayers) {
      expect(await listFilesRecursive(template.templateDir), `${template.id} template`).toContain('package.json');

      for (const layer of Object.values(template.layers ?? {}).flatMap((layers) => Object.values(layers))) {
        const fragment = JSON.parse(await fs.readFile(path.join(layer.dir, 'package.json'), 'utf8')) as Record<string, unknown>;

        for (const key of ['name', 'version', 'scripts']) {
          expect(fragment, `${layer.dir}/package.json must not set "${key}"`).not.toHaveProperty(key);
        }
        expect(Object.keys(fragment).length, `${layer.dir}/package.json adds nothing`).toBeGreaterThan(0);
      }
    }
  });

  it('the shared template files mention no CSS framework: that is what the layers are for', async () => {
    for (const template of templatesWithLayers) {
      for (const file of (await listFilesRecursive(template.templateDir)).filter((name) => TEXT_FILE.test(name))) {
        const text = await fs.readFile(path.join(template.templateDir, file), 'utf8');
        expect(text, `${template.id}: ${file}`).not.toMatch(/tailwind|@mui\/|@emotion\/|@angular\/material|@angular\/cdk/i);
      }
    }
  });
});
