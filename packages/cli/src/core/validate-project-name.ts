export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Kept intentionally stricter than the full npm package name spec (which
// also allows scopes, dots, underscores, etc.) so the same name is always
// safe to use as a directory name, an npm package name, and the basis for
// a PascalCase .NET namespace without extra escaping rules.
const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const MAX_LENGTH = 100;
const RESERVED_NAMES = new Set(['node_modules', 'favicon.ico', 'test', 'src', 'shared', 'apps']);

export function validateProjectName(name: string): ValidationResult {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Project name cannot be empty.' };
  }
  if (trimmed.length > MAX_LENGTH) {
    return { valid: false, error: `Project name must be ${MAX_LENGTH} characters or fewer.` };
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return {
      valid: false,
      error:
        'Project name must start with a lowercase letter and contain only lowercase letters, numbers, and hyphens (e.g. "customer-portal").',
    };
  }
  if (RESERVED_NAMES.has(trimmed)) {
    return { valid: false, error: `"${trimmed}" is a reserved name. Please choose another.` };
  }

  return { valid: true };
}
