#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { scanText } = require('./validate-secrets.cjs');

const defaultImages = [
  'proprium-database-migrations:latest',
  'proprium-platform-api:latest',
  'proprium-web:latest',
];
const sensitiveName = /(?:PASSWORD|SECRET|TOKEN|PRIVATE_KEY|SIGNING_KEY|CLIENT_SECRET|API_KEY|CREDENTIAL|CONNECTION_STRING)/i;

function scanImageMetadata(image, inspectContent, historyContent) {
  const findings = [
    ...scanText(`artifacts/${image}/inspect.json`, inspectContent),
    ...scanText(`artifacts/${image}/Dockerfile`, historyContent),
  ];
  let inspection;
  try {
    inspection = JSON.parse(inspectContent);
  } catch {
    return [...findings, {
      path: `artifacts/${image}/inspect.json`,
      line: 1,
      code: 'docker-image-inspect',
      message: 'Docker image inspection output was not valid JSON',
    }];
  }
  for (const entry of inspection[0]?.Config?.Env ?? []) {
    const key = entry.split('=', 1)[0];
    if (sensitiveName.test(key)) {
      findings.push({
        path: `artifacts/${image}/inspect.json`,
        line: 1,
        code: 'docker-image-secret-env',
        message: 'final Docker image configuration contains a secret-shaped environment entry',
      });
    }
  }
  return findings;
}

function docker(args) {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    throw new Error(`docker ${args.slice(0, 2).join(' ')} failed`);
  }
  return result.stdout;
}

function main() {
  const images = process.argv.slice(2).length ? process.argv.slice(2) : defaultImages;
  const findings = [];
  try {
    for (const image of images) {
      const inspection = docker(['image', 'inspect', image]);
      const history = docker(['image', 'history', '--no-trunc', '--format', '{{json .}}', image]);
      findings.push(...scanImageMetadata(image, inspection, history));
    }
  } catch (error) {
    console.error(`Docker image secret scan: FAIL (${error.message})`);
    process.exit(1);
  }
  if (findings.length) {
    for (const finding of findings) {
      console.error(`${finding.path}:${finding.line} [${finding.code}] ${finding.message}`);
    }
    console.error(`Docker image secret scan: FAIL (${findings.length} finding${findings.length === 1 ? '' : 's'}; candidate values suppressed)`);
    process.exit(1);
  }
  console.log(`Docker image secret scan: PASS (${images.length} images; configuration and history)`);
}

if (require.main === module) main();

module.exports = { scanImageMetadata };
