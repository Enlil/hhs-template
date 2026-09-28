import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { backendRegistry, frontendRegistry } from '../src/registry/index.js';

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
    expect(Object.keys(backendRegistry).sort()).toEqual(['dotnet', 'node']);
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
