const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');
const directory = join(root, 'config', 'change-sets');
const idPattern = /^NURU-CS-\d{4}$/;

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadChangeSets() {
  const index = readJson(join(directory, 'index.json'));
  return { index, records: index.records.map((file) => ({ file, value: readJson(join(directory, file)) })) };
}

function validateChangeSets({ index, records } = loadChangeSets()) {
  const errors = [];
  if (index.schemaVersion !== 1) errors.push('index schemaVersion must be 1.');
  if (index.idFormat !== 'NURU-CS-####') errors.push('index idFormat must be NURU-CS-####.');
  if (!Array.isArray(index.records) || index.records.length === 0) errors.push('index records must be a non-empty array.');
  const ids = new Set();
  for (const { file, value } of records) {
    if (!file.endsWith('.json') || !existsSync(join(directory, file))) errors.push(`record ${file} is missing.`);
    if (!idPattern.test(value.id ?? '')) errors.push(`${file} must declare an id formatted NURU-CS-####.`);
    if (`${value.id}.json` !== file) errors.push(`${file} must match its declared id.`);
    if (ids.has(value.id)) errors.push(`${value.id} is duplicated.`); else ids.add(value.id);
    if (value.project !== 'NURU') errors.push(`${value.id} must belong to NURU.`);
    for (const field of ['purpose', 'expectedAreas', 'expectedPaths', 'dependencies', 'requiredCommands']) {
      const entry = value[field];
      if ((typeof entry === 'string' && !entry.trim()) || (Array.isArray(entry) && entry.length === 0) || entry === undefined) errors.push(`${value.id} requires ${field}.`);
    }
    if (!['PLANNED', 'ACTIVE', 'QUALIFIED', 'ARCHIVED'].includes(value.status)) errors.push(`${value.id} has an invalid status.`);
  }
  return errors;
}

module.exports = { loadChangeSets, validateChangeSets };
