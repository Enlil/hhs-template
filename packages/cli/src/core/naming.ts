/** Project names are already npm-safe (see validate-project-name.ts), so the package name is just an alias today; kept as its own function since scoped-package support is a likely future addition. */
export function toPackageName(projectName: string): string {
  return projectName;
}

/** "customer-portal" -> "CustomerPortal". Prefixes with "App" if the result would start with a digit, since that's not a legal .NET identifier. */
export function toDotnetNamespace(projectName: string): string {
  const pascalCase = projectName
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  return /^[0-9]/.test(pascalCase) ? `App${pascalCase}` : pascalCase;
}
