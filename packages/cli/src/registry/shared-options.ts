import type { ChoiceOption } from './types.js';

/**
 * The look of the starter app. Both frontends offer it, with the same choices,
 * so there is a single `--css-framework` flag. What each choice actually adds
 * is up to the frontend: its own `layers` (see TemplateLayer in types.ts).
 */
export const cssFrameworkOption: ChoiceOption = {
  kind: 'choice',
  id: 'css-framework',
  label: 'CSS framework',
  description: 'the look of the starter app: Tailwind CSS, or Material Design (MUI for React, Angular Material for Angular)',
  choices: [
    { value: 'tailwind', label: 'Tailwind CSS' },
    { value: 'material', label: 'Material Design' },
  ],
  default: 'tailwind',
};
