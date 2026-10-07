import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allOptions, backendRegistry, frontendRegistry } from '../src/registry/index.js';

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

  it('option ids are kebab-case and unique across every template (they become global flags and #if markers)', () => {
    const ids = allOptions().map((entry) => entry.option.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id, `option id "${id}"`).toMatch(/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    }
  });

  it('every option says what kind it is', () => {
    for (const { option } of allOptions()) {
      expect(['toggle', 'choice'], `option "${option.id}"`).toContain(option.kind);
    }
  });

  it('every choice option has something to choose between, and a default that is one of the choices', () => {
    const choiceOptions = allOptions().flatMap(({ option }) => (option.kind === 'choice' ? [option] : []));
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

  it('every registry entry\'s id matches its own key', () => {
    for (const [key, template] of Object.entries(frontendRegistry)) {
      expect(template.id).toBe(key);
    }
    for (const [key, template] of Object.entries(backendRegistry)) {
      expect(template.id).toBe(key);
    }
  });
});
