import path from 'node:path';
import { resolveTemplatesRoot } from '../core/paths.js';
import type { FrontendId, FrontendTemplate } from './types.js';

const templatesRoot = resolveTemplatesRoot();

/**
 * The frontend template registry. To add a new frontend (e.g. Vue), add an
 * entry here pointing at a new `templates/frontend/<id>/template` directory
 * — nothing in the CLI's generation engine needs to change. See
 * docs/adding-a-frontend.md.
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
  },
};

export const frontendChoices: FrontendTemplate[] = Object.values(frontendRegistry);
