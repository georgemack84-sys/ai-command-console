const fs = require("fs");
const path = require("path");

async function readFile(targetPath) {
  if (!targetPath) {
    return "No file path provided.";
  }

  const resolvedPath = path.resolve(targetPath);

  if (!fs.existsSync(resolvedPath)) {
    return `File not found: ${resolvedPath}`;
  }

  const stats = fs.statSync(resolvedPath);

  if (!stats.isFile()) {
    return `Not a file: ${resolvedPath}`;
  }

  const content = fs.readFileSync(resolvedPath, "utf8");
  return `Contents of ${resolvedPath}\n\n${content}`;
}

module.exports = readFile;