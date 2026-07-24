import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const catalog = path.resolve(root, 'src/generated/permission-catalog.ts');
const catalogText = fs.readFileSync(catalog, 'utf8');
const permissionKeys = new Set(
  [...catalogText.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1]),
);
const requestedPath =
  process.argv.find((arg) => arg.startsWith('--path='))?.slice(7) ?? 'src';
const files = collect(path.resolve(root, requestedPath));
const sourceFiles = new Set(files.map((file) => path.resolve(file)));
const program = ts.createProgram(files, {
  strict: true,
  target: ts.ScriptTarget.ES2024,
  jsx: ts.JsxEmit.ReactJSX,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});
const checker = program.getTypeChecker();
const errors = [];

for (const sourceFile of program.getSourceFiles()) {
  if (
    sourceFiles.has(path.resolve(sourceFile.fileName)) &&
    path.resolve(sourceFile.fileName) !== catalog
  )
    visit(sourceFile);
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
    .flatMap((entry) => collect(path.join(target, entry.name)))
    .filter((entry) => !entry.includes(`${path.sep}generated${path.sep}`));
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
function isPermissionKeyType(type) {
  return (
    ts.isTypeReferenceNode(type) && type.typeName.getText() === 'PermissionKey'
  );
}
function staticString(node) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.PlusToken
  ) {
    const left = staticString(node.left);
    const right = staticString(node.right);
    return left === undefined || right === undefined ? undefined : left + right;
  }
  if (ts.isTemplateExpression(node) && node.templateSpans.length === 0)
    return node.head.text;
  return undefined;
}
function visit(node) {
  if (ts.isStringLiteralLike(node) && permissionKeys.has(node.text))
    report(
      node,
      'Handwritten permission literal: import Permission from the generated catalog.',
    );
  if (
    (ts.isBinaryExpression(node) || ts.isTemplateExpression(node)) &&
    permissionKeys.has(staticString(node))
  )
    report(
      node,
      'Constructed permission value: import Permission from the generated catalog.',
    );
  if (
    (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) &&
    isPermissionKeyType(node.type)
  )
    report(
      node,
      'Unsafe PermissionKey assertion: use Permission from the generated catalog.',
    );
  if (
    ts.isExportDeclaration(node) &&
    node.moduleSpecifier?.getText().includes('permission-catalog')
  )
    report(node, 'Permission catalog re-exports are prohibited.');
  if (
    ts.isElementAccessExpression(node) &&
    node.expression.getText() === 'Permission'
  )
    report(node, 'Permission bracket access is prohibited.');
  if (ts.isCallExpression(node)) {
    const declaration = checker.getResolvedSignature(node)?.declaration;
    if (
      declaration &&
      (ts.isFunctionDeclaration(declaration) ||
        ts.isMethodDeclaration(declaration))
    ) {
      declaration.parameters.forEach((parameter, index) => {
        if (isPermissionKeyType(parameter.type) && node.arguments[index]) {
          const actual = checker.getTypeAtLocation(node.arguments[index]);
          if (actual.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown))
            report(
              node.arguments[index],
              'Permission argument must be a statically typed PermissionKey.',
            );
        }
      });
    }
  }
  ts.forEachChild(node, visit);
}
