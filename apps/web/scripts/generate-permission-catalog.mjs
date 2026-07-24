import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const sourcePath = path.resolve(
  here,
  '../../../services/api/Proprium.Domain/Identity/PermissionCatalog.cs',
);
const outputPath = path.resolve(here, '../src/generated/permission-catalog.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const matches = [
  ...source.matchAll(
    /public static PermissionDefinition\s+(\w+)\s+\{\s*get;\s*\}\s*=\s*new\("([^"]+)"/g,
  ),
];
const entries = matches
  .map(([, name, key]) => ({ name, key }))
  .sort((left, right) => left.key.localeCompare(right.key));
if (
  entries.length === 0 ||
  new Set(entries.map(({ key }) => key)).size !== entries.length
) {
  throw new Error(
    'The backend PermissionCatalog did not yield a unique non-empty catalog.',
  );
}
const content = `// GENERATED from services/api/Proprium.Domain/Identity/PermissionCatalog.cs. Do not edit.\nexport const Permission = {\n${entries.map(({ name, key }) => `  ${name}: '${key}',`).join('\n')}\n} as const;\n\nexport type PermissionKey = (typeof Permission)[keyof typeof Permission];\n\nexport const permissionValues: ReadonlySet<string> = new Set(\n  Object.values(Permission),\n);\n`;
if (process.argv.includes('--check')) {
  if (
    !fs.existsSync(outputPath) ||
    fs.readFileSync(outputPath, 'utf8') !== content
  ) {
    throw new Error(
      'Generated permission catalog is stale. Run npm run permissions:generate.',
    );
  }
} else fs.writeFileSync(outputPath, content);
