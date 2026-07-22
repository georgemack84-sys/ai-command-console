import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const localFile = resolve('.env.local');
if (existsSync(localFile)) {
  for (const line of readFileSync(localFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)\s*$/);
    if (match && process.env[match[1]] === undefined)
      process.env[match[1]] = match[2];
  }
}

try {
  await import('../src/config/environment.ts');
  console.log('Public environment validation passed.');
} catch (error) {
  console.error('Public environment validation failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
