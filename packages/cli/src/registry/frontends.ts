import path from 'node:path';
import { resolveTemplatesRoot } from '../core/paths.js';
import { cssFrameworkOption } from './shared-options.js';
import type { FrontendId, FrontendTemplate, TemplateLayer } from './types.js';

const templatesRoot = resolveTemplatesRoot();

/**
 * One CSS framework's files for a frontend: `templates/frontend/<id>/ui/<name>`.
 * `tokenFiles` are the shared design-token files (templates/shared/design-tokens)
 * that framework reads: every look takes tokens.css and base.css (the guide's
 * fonts and type scale); the rest depends on how the framework reads tokens.
 */
function uiLayer(frontend: FrontendId, name: string, tokenFiles: string[]): TemplateLayer {
  return { dir: path.join(templatesRoot, 'frontend', frontend, 'ui', name), tokenFiles };
}

/**
 * The frontend template registry. To add a new frontend (e.g. Vue), add an
 * entry here pointing at a new `templates/frontend/<id>/template` directory
 * (what every look shares) plus one `ui/<css-framework>` folder per CSS
 * framework it supports — nothing in the CLI's generation engine needs to
 * change. See docs/adding-a-frontend.md.
 */
export const frontendRegistry: Record<FrontendId, FrontendTemplate> = {
  react: {
    id: 'react',
    label: 'React',
    description: 'React + TypeScript + Vite',
    templateDir: path.join(templatesRoot, 'frontend', 'react', 'template'),
    targetDir: 'apps/web',
    devPort: 3000,
    devCommand: 'npm run dev -w apps/web',
    workspaceMember: true,
    envDocLine: '`apps/web/.env.example` — the frontend\'s API base URL (`VITE_API_URL`)',
    options: [cssFrameworkOption],
    layers: {
      'css-framework': {
        tailwind: uiLayer('react', 'tailwind', ['tokens.css', 'base.css', 'tailwind-theme.css']),
        // The MUI theme is built from the token values, so it reads tokens.json as well.
        material: uiLayer('react', 'material', ['tokens.css', 'base.css', 'tokens.json']),
      },
    },
  },
  angular: {
    id: 'angular',
    label: 'Angular',
    description: 'Angular + TypeScript (standalone components)',
    templateDir: path.join(templatesRoot, 'frontend', 'angular', 'template'),
    targetDir: 'apps/web',
    devPort: 4200,
    devCommand: 'npm run dev -w apps/web',
    workspaceMember: true,
    envDocLine: '`apps/web/src/environments/environment.ts` — the frontend\'s API base URL (`apiUrl`)',
    options: [cssFrameworkOption],
    layers: {
      'css-framework': {
        tailwind: uiLayer('angular', 'tailwind', ['tokens.css', 'base.css', 'tailwind-theme.css']),
        material: uiLayer('angular', 'material', ['tokens.css', 'base.css']),
      },
    },
  },
};

export const frontendChoices: FrontendTemplate[] = Object.values(frontendRegistry);
