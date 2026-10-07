import { allOptions } from '../registry/options.js';
import type { BackendTemplate, FrontendTemplate, OptionValue } from '../registry/types.js';

export interface ResolvedOptions {
  /** Ids of the on/off options that are on: what `#if <id>` markers check. */
  enabled: Set<string>;
  /** The final value of every option this frontend + backend offers, by option id: true/false for on/off options, the picked text for choices. */
  values: Record<string, OptionValue>;
}

/**
 * Settles every option the chosen frontend and backend offer: what was asked
 * for wins, otherwise the option's default. Rejects an option this stack
 * doesn't offer, and a value the option doesn't allow.
 */
export function resolveOptions(
  frontend: FrontendTemplate,
  backend: BackendTemplate,
  requested: Record<string, OptionValue> = {},
): ResolvedOptions {
  const offered = [...(frontend.options ?? []), ...(backend.options ?? [])];

  for (const [id, value] of Object.entries(requested)) {
    const option = offered.find((candidate) => candidate.id === id);

    if (!option) {
      const offeredBy = allOptions().find((entry) => entry.option.id === id)?.owner.label;
      throw new Error(
        `Option "${id}" isn't available for ${frontend.label} + ${backend.label}.` +
          (offeredBy ? ` It only applies to ${offeredBy}.` : ' There is no such option.'),
      );
    }

    if (option.kind === 'toggle' && typeof value !== 'boolean') {
      throw new Error(`Option "${id}" must be true or false (got ${JSON.stringify(value)}).`);
    }
    if (option.kind === 'choice' && !option.choices.some((choice) => choice.value === value)) {
      throw new Error(
        `Option "${id}" must be one of: ${option.choices.map((choice) => choice.value).join(', ')} (got ${JSON.stringify(value)}).`,
      );
    }
  }

  const enabled = new Set<string>();
  const values: Record<string, OptionValue> = {};
  for (const option of offered) {
    const value = requested[option.id] ?? option.default;
    values[option.id] = value;
    if (option.kind === 'toggle' && value === true) enabled.add(option.id);
  }

  return { enabled, values };
}
