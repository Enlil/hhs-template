export type FrontendId = 'react' | 'angular';
export type BackendId = 'node' | 'dotnet';

/**
 * The full set of `{{token}}` placeholders available to every template.
 * Adding a key here makes it available for substitution in file contents
 * and file/directory names across ALL templates (see core/render-tree.ts).
 */
export interface TemplateVariables {
  projectName: string;
  packageName: string;
  dotnetNamespace: string;
  frontendLabel: string;
  backendLabel: string;
  frontendPort: number;
  backendPort: number;
  apiUrl: string;
  frontendUrl: string;
  frontendDevCommand: string;
  backendDevCommand: string;
  frontendEnvLine: string;
  backendEnvLine: string;
  backendPrerequisiteLine: string;
  backendBuildNote: string;
  [key: string]: string | number;
}

export interface GenerationContext {
  projectDir: string;
  variables: TemplateVariables;
  log: (message: string) => void;
}

interface TemplateDefinitionBase {
  label: string;
  description: string;
  /** Absolute path to the template's source files on disk, resolved via resolveTemplatesRoot(). */
  templateDir: string;
  /** Destination path relative to the generated project root, e.g. "apps/web". */
  targetDir: string;
  /** Default local dev server port for this template. */
  devPort: number;
  /** Human-readable command shown in "next steps" and used to compose the root dev script. Run from the generated project root. */
  devCommand: string;
  /** Whether targetDir should be added to the generated project's root npm workspaces. */
  workspaceMember: boolean;
  /** One-line markdown (with its own inline code spans) describing where this template's real runtime config lives, for the generated root README. */
  envDocLine: string;
}

export interface FrontendTemplate extends TemplateDefinitionBase {
  id: FrontendId;
}

export interface BackendTemplate extends TemplateDefinitionBase {
  id: BackendId;
  /** Path the frontend calls for the example endpoint, e.g. "/api/health". Used for docs/next-steps only. */
  healthPath: string;
  /** Extra "## Prerequisites" bullet (no leading "- "), e.g. a link to install the .NET SDK. Omitted for backends with nothing beyond Node.js/npm. */
  extraPrerequisite?: string;
  /** Extra markdown appended after the generated README's "npm run build" block, for backends `npm run build --workspaces` doesn't reach. */
  extraBuildNote?: string;
  /**
   * Optional hook for install steps the root `npm install` can't cover
   * (e.g. `dotnet restore`). Registry-driven so generate-project.ts never
   * branches on a specific backend id.
   */
  postInstall?: (ctx: GenerationContext) => Promise<void> | void;
}
