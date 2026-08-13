import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const requestedPath =
  process.argv.find((arg) => arg.startsWith('--path='))?.slice(7) ?? 'src';
const files = collect(path.resolve(root, requestedPath));
const fileSet = new Set(files.map((file) => path.resolve(file)));
const program = ts.createProgram(files, {
  target: ts.ScriptTarget.ES2024,
  jsx: ts.JsxEmit.ReactJSX,
});
const errors = [];
const forbiddenPackages = new Set(['axios', 'ky', 'superagent', 'got']);
const approvedTransportDirectory = path.resolve(root, 'src/lib/api') + path.sep;

for (const sourceFile of program.getSourceFiles())
  if (fileSet.has(path.resolve(sourceFile.fileName)))
    visit(
      sourceFile,
      path.resolve(sourceFile.fileName).startsWith(approvedTransportDirectory),
    );
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(root, 'package.json'), 'utf8'),
);
for (const group of [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
]) {
  for (const name of Object.keys(manifest[group] ?? {}))
    if (forbiddenPackages.has(name))
      errors.push(`package.json: unapproved HTTP client dependency ${name}.`);
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

function collect(target) {
  if (!fs.existsSync(target)) return [];
  if (!fs.statSync(target).isDirectory())
    return /\.(ts|tsx)$/.test(target) ? [target] : [];
  return fs
    .readdirSync(target, { withFileTypes: true })
    .flatMap((entry) => collect(path.join(target, entry.name)));
}
function report(node, message) {
  const { line, character } = ts.getLineAndCharacterOfPosition(
    node.getSourceFile(),
    node.getStart(),
  );
  errors.push(
    `${path.relative(root, node.getSourceFile().fileName)}:${line + 1}:${character + 1}: ${message}`,
  );
}
function accessIs(node, object, property) {
  return (
    ts.isPropertyAccessExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === object &&
    node.name.text === property
  );
}
function visit(node, approved) {
  if (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    forbiddenPackages.has(node.moduleSpecifier.text)
  )
    report(
      node,
      `Unapproved HTTP package import: ${node.moduleSpecifier.text}.`,
    );
  if (ts.isCallExpression(node)) {
    if (
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      ts.isStringLiteral(node.arguments[0]) &&
      forbiddenPackages.has(node.arguments[0].text)
    )
      report(
        node,
        `Unapproved dynamic HTTP package import: ${node.arguments[0].text}.`,
      );
    if (
      !approved &&
      ((ts.isIdentifier(node.expression) && node.expression.text === 'fetch') ||
        accessIs(node.expression, 'window', 'fetch') ||
        accessIs(node.expression, 'globalThis', 'fetch'))
    )
      report(node, 'Direct fetch is permitted only in src/lib/api.');
    if (accessIs(node.expression, 'navigator', 'sendBeacon'))
      report(node, 'navigator.sendBeacon bypasses the canonical API client.');
  }
  if (
    ts.isNewExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 'XMLHttpRequest'
  )
    report(node, 'XMLHttpRequest bypasses the canonical API client.');
  ts.forEachChild(node, (child) => visit(child, approved));
}
