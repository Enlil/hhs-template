// Stand-in for the real CLI, used by ui-server.test.ts. It echoes how it was
// called (folder + arguments) and misbehaves on request, depending on the
// project name (its first argument):
//   fail-*  prints an error like the real CLI does, and exits with code 1
//   warn-*  prints the warning lines the real CLI prints when a step is skipped
//   slow-*  waits until a file called "go" exists in its folder
import { existsSync } from 'node:fs';

const args = process.argv.slice(2);
const [name = ''] = args;

console.log(`cwd=${process.cwd()}`);
console.log(`args=${JSON.stringify(args)}`);

if (name.startsWith('fail')) {
  console.error('\n✖ Something broke: reason A\nsecond line');
  process.exit(1);
}

if (name.startsWith('warn')) {
  console.log('  Warning: "npm install" did not finish successfully. You can retry it manually in the project directory.');
  console.log('  Skipped Maven dependency prefetch — no JDK was found on your PATH.');
}

if (name.startsWith('slow')) {
  while (!existsSync('go')) {
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

console.log('done');
