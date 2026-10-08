import { backendRegistry } from './backends.js';
import { frontendRegistry } from './frontends.js';
import type { BackendTemplate, FrontendTemplate, TemplateOption } from './types.js';

export interface OptionGroup {
  option: TemplateOption;
  /** Every template that offers it. */
  owners: Array<FrontendTemplate | BackendTemplate>;
}

/**
 * Every distinct option in the registry, with the templates that offer it, so
 * the CLI can register one flag per option. The same id on several templates is
 * one option (one flag, one meaning), so they must define it identically.
 */
export function optionGroups(): OptionGroup[] {
  const groups = new Map<string, OptionGroup>();

  for (const owner of [...Object.values(frontendRegistry), ...Object.values(backendRegistry)]) {
    for (const option of owner.options ?? []) {
      const existing = groups.get(option.id);
      if (!existing) {
        groups.set(option.id, { option, owners: [owner] });
      } else if (JSON.stringify(existing.option) === JSON.stringify(option)) {
        existing.owners.push(owner);
      } else {
        throw new Error(
          `Option "${option.id}" is defined differently by ${existing.owners[0]?.label} and ${owner.label}. ` +
            'An option offered by several templates must be defined the same way: share one object.',
        );
      }
    }
  }

  return [...groups.values()];
}

/** "my-option" -> "myOption": the key commander stores `--my-option` under, and the name of a choice option's `{{placeholder}}`. */
export function optionFlagKey(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_match, char: string) => char.toUpperCase());
}
