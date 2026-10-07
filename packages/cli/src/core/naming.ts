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

/** "customer-portal" -> "customerportal", used as the leaf segment of the Java package `com.example.<this>` (and its matching source folder — see the springboot template). Prefixes with "app" if the result would start with a digit, since that's not a legal Java identifier. */
export function toJavaPackageName(projectName: string): string {
  const lower = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return /^[0-9]/.test(lower) ? `app${lower}` : lower;
}
