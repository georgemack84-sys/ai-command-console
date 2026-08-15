#!/usr/bin/env node

const { existsSync, lstatSync, readdirSync, readFileSync } = require('node:fs');
const { extname, join, relative } = require('node:path');
const { scanText } = require('./validate-secrets.cjs');

const textExtensions = new Set([
  '.css', '.html', '.js', '.json', '.map', '.rsc', '.txt', '.xml', '.yml', '.yaml',
]);

function collectFiles(root) {
  if (!existsSync(root)) throw new Error(`artifact root does not exist: ${root}`);
  if (!lstatSync(root).isDirectory()) return [root];
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else if (entry.isFile() && textExtensions.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

function scanArtifact(root, sentinels = []) {
  const findings = [];
  for (const path of collectFiles(root)) {
    const bytes = readFileSync(path);
    if (bytes.includes(0)) continue;
    const content = bytes.toString('utf8');
    const displayPath = relative(process.cwd(), path).replaceAll('\\', '/') || path;
    findings.push(...scanText(displayPath, content));
    for (const sentinel of sentinels.filter(Boolean)) {
      let offset = content.indexOf(sentinel);
      while (offset !== -1) {
        findings.push({
          path: displayPath,
          line: content.slice(0, offset).split(/\r?\n/).length,
          code: 'secret-sentinel',
          message: 'synthetic server-only sentinel escaped into a generated artifact',
        });
        offset = content.indexOf(sentinel, offset + sentinel.length);
      }
    }
  }
  return findings;
}

function parseArguments(args) {
  const options = { scope: 'artifact', sentinelEnvironmentNames: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--root') options.root = args[++index];
    else if (argument === '--scope') options.scope = args[++index];
    else if (argument === '--sentinel-env') options.sentinelEnvironmentNames.push(args[++index]);
    else throw new Error(`unsupported argument: ${argument}`);
  }
  if (!options.root) throw new Error('--root is required');
  return options;
}

function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
    const sentinels = options.sentinelEnvironmentNames.map((name) => {
      const value = process.env[name];
      if (!value) throw new Error(`required sentinel environment variable is missing: ${name}`);
      return value;
    });
    const findings = scanArtifact(options.root, sentinels);
    if (findings.length) {
      for (const finding of findings) {
        console.error(`${finding.path}:${finding.line} [${finding.code}] ${finding.message}`);
      }
      console.error(`${options.scope} secret artifact scan: FAIL (${findings.length} finding${findings.length === 1 ? '' : 's'}; candidate values suppressed)`);
      process.exit(1);
    }
    console.log(`${options.scope} secret artifact scan: PASS`);
  } catch (error) {
    console.error(`${options?.scope ?? 'artifact'} secret artifact scan: FAIL (${error.message})`);
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { collectFiles, parseArguments, scanArtifact };
