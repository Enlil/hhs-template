import { describe, expect, it } from 'vitest';
import { validateProjectName } from '../src/core/validate-project-name.js';

describe('validateProjectName', () => {
  it.each(['customer-portal', 'app', 'my-app-2', 'a'])('accepts "%s"', (name) => {
    expect(validateProjectName(name).valid).toBe(true);
  });

  it.each([
    ['', 'empty'],
    ['Customer-Portal', 'uppercase'],
    ['1-app', 'leading digit'],
    ['my_app', 'underscore'],
    ['my app', 'space'],
    ['node_modules', 'reserved name'],
    ['a'.repeat(101), 'too long'],
  ])('rejects "%s" (%s)', (name) => {
    const result = validateProjectName(name);
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
