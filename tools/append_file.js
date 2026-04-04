const fs = require("fs");
const path = require("path");

async function appendFile(targetPath, content) {
  if (!targetPath) {
    return "No file path provided.";
  }

  const resolvedPath = path.resolve(targetPath);
  const dir = path.dirname(resolvedPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.appendFileSync(resolvedPath, content || "", "utf8");
  return `Appended to file: ${resolvedPath}`;
}

module.exports = appendFile;