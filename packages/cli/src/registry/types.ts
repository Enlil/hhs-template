export type FrontendId = 'react' | 'angular';
export type BackendId = 'node' | 'dotnet' | 'springboot';

/**
 * The full set of `{{token}}` placeholders available to every template.
 * Adding a key here makes it available for substitution in file contents
 * and file/directory names across ALL templates (see core/render-tree.ts).
 * Each choice option the chosen stack offers adds one more, named after the
 * option (`java-version` -> `javaVersion`); see ChoiceOption.
 */
export interface TemplateVariables {
  projectName: string;
  packageName: string;
  appVersion: string;
  dotnetNamespace: string;
  javaPackageName: string;
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

interface OptionBase {
  /**
   * kebab-case. Becomes the CLI flag `--<id>` (plus `--no-<id>` for an on/off
   * option) and, for a choice, the placeholder `{{camelCaseId}}` — so it must be
   * unique across ALL templates.
   */
  id: string;
  /** Short name used in prompts and the browser form, e.g. "Lombok". */
  label: string;
  /** One plain sentence on what it does; shown in prompts, `--help` and the form. */
  description: string;
}

/**
 * An on/off extra a template can offer (e.g. Lombok for Spring Boot). The
 * template files react to it with `#if <id>` marker blocks (see
 * core/conditionals.ts). Flags: `--<id>` / `--no-<id>`.
 */
export interface ToggleOption extends OptionBase {
  kind: 'toggle';
  /** Whether it's on when the user doesn't say either way. */
  default: boolean;
}

/**
 * A pick-one setting a template can offer (e.g. the Java version for Spring
 * Boot). The picked value reaches the template files as the placeholder
 * `{{camelCaseId}}` — `java-version` becomes `{{javaVersion}}`. Flag:
 * `--<id> <value>`.
 */
export interface ChoiceOption extends OptionBase {
  kind: 'choice';
  /** The allowed values and how each is shown, in display order (put the default first). */
  choices: Array<{ value: string; label: string }>;
  /** One of the `choices` values; used when the user doesn't say. */
  default: string;
}

export type TemplateOption = ToggleOption | ChoiceOption;

/** What an option can be set to: true/false for an on/off option, the picked value for a choice. */
export type OptionValue = boolean | string;

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
  /** Optional extras the user can switch on for this template. */
  options?: TemplateOption[];
}

export interface FrontendTemplate extends TemplateDefinitionBase {
  id: FrontendId;
}

export interface BackendTemplate extends TemplateDefinitionBase {
  id: BackendId;
  /** Path the frontend calls for the example endpoint, e.g. "/api/health". Used for docs/next-steps only. */
  healthPath: string;
  /**
   * Extra "## Prerequisites" bullet (no leading "- "), e.g. a link to install the .NET SDK. Omitted for backends with nothing beyond Node.js/npm.
   * May use `{{placeholders}}` such as a choice option's value (`JDK {{javaVersion}}+`); they are filled in with what was picked.
   */
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
