const fs = require("fs");
const path = require("path");

async function writeFile(targetPath, content) {
  if (!targetPath) {
    return "No file path provided.";
  }

  const resolvedPath = path.resolve(targetPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(resolvedPath, content || "", "utf8");
  return `Wrote file: ${resolvedPath}`;
}

module.exports = writeFile;