import { backendRegistry } from './backends.js';
import { frontendRegistry } from './frontends.js';
import type { BackendTemplate, FrontendTemplate, TemplateOption } from './types.js';

export interface OptionEntry {
  option: TemplateOption;
  /** The template that offers this option. */
  owner: FrontendTemplate | BackendTemplate;
}

/** Every option offered by any template, so the CLI can register one flag pair per option. */
export function allOptions(): OptionEntry[] {
  return [...Object.values(frontendRegistry), ...Object.values(backendRegistry)].flatMap((owner) =>
    (owner.options ?? []).map((option) => ({ option, owner })),
  );
}

/** "my-option" -> "myOption": the key commander stores `--my-option` under. */
export function optionFlagKey(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}
