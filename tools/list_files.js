const fs = require("fs");
const path = require("path");

async function listFiles(targetPath = ".") {
  const resolvedPath = path.resolve(targetPath);

  if (!fs.existsSync(resolvedPath)) {
    return `Path not found: ${resolvedPath}`;
  }

  const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });

  if (!entries.length) {
    return `No files found in ${resolvedPath}`;
  }

  const lines = entries.map((entry) => {
    const type = entry.isDirectory() ? "[DIR]" : "[FILE]";
    return `${type} ${entry.name}`;
  });

  return `Contents of ${resolvedPath}\n` + lines.join("\n");
}

module.exports = listFiles;