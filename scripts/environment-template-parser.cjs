const keyPattern = /^([A-Z][A-Z0-9_]*(?:__[A-Z][A-Z0-9_]*)*)=(.*)$/;

function parseEnvironmentTemplate(content, path = '<environment-template>') {
  const entries = [];
  const comments = [];
  const errors = [];
  const firstLineByKey = new Map();

  for (const [index, line] of content.split(/\r?\n/).entries()) {
    const lineNumber = index + 1;
    if (!line.trim()) continue;
    if (line.trimStart().startsWith('#')) {
      comments.push({ line: lineNumber, text: line.trimStart().slice(1).trim() });
      continue;
    }
    const match = line.match(keyPattern);
    if (!match) {
      errors.push({
        id: 'CONFIG-002',
        path,
        line: lineNumber,
        message: 'expected a portable uppercase KEY=value assignment',
      });
      continue;
    }
    const [, key, value] = match;
    if (firstLineByKey.has(key)) {
      errors.push({
        id: 'CONFIG-004',
        path,
        line: lineNumber,
        key,
        previousLine: firstLineByKey.get(key),
        message: `duplicates ${key}; first defined on line ${firstLineByKey.get(key)}`,
      });
      continue;
    }
    firstLineByKey.set(key, lineNumber);
    entries.push({ key, value, line: lineNumber });
  }

  return {
    path,
    entries,
    comments,
    errors,
    values: new Map(entries.map(({ key, value }) => [key, value])),
  };
}

module.exports = { parseEnvironmentTemplate };
