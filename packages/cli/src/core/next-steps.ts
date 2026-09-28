import path from 'node:path';
import pc from 'picocolors';
import type { GenerateProjectResult } from './generate-project.js';

export function printNextSteps(result: GenerateProjectResult): void {
  const projectFolderName = path.basename(result.projectDir);
  const { frontend, backend, variables } = result;

  const lines = [
    '',
    pc.green(`✔ ${variables.projectName} is ready.`),
    '',
    pc.bold('Next steps:'),
    `  cd ${projectFolderName}`,
  ];

  if (!result.installed) {
    lines.push('  npm install');
  }

  lines.push('  npm run dev');
  lines.push('');
  lines.push(pc.bold('This starts:'));
  const healthUrl = `http://localhost:${backend.devPort}${backend.healthPath}`;
  lines.push(`  ${frontend.label} frontend  ${pc.cyan(variables.frontendUrl as string)}`);
  lines.push(`  ${backend.label} backend    ${pc.cyan(healthUrl)}`);

  if (backend.id === 'dotnet') {
    lines.push('');
    lines.push(pc.dim('Note: the .NET API runs separately from npm — "npm run dev" launches it via "dotnet run".'));
    lines.push(pc.dim('Make sure the .NET SDK (https://dotnet.microsoft.com/download) is installed.'));
  }

  lines.push('');
  lines.push(pc.dim('See README.md in the generated project for more details.'));
  lines.push('');

  console.log(lines.join('\n'));
}
