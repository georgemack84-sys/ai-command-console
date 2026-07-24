import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const destination = resolve('public/theme-bootstrap.js');
await mkdir(dirname(destination), { recursive: true });
await copyFile(resolve('scripts/theme-bootstrap.js'), destination);
