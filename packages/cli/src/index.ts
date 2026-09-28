#!/usr/bin/env node
import { run } from './cli.js';

run(process.argv).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
