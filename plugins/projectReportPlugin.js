const fs = require("fs");
const path = require("path");

module.exports = {
  name: "projectReportPlugin",
  description: "Creates a lightweight project report from the current directory or a provided path.",

  async run(context = {}) {
    let targetDir = process.cwd();

    if (context.pluginArg) {
      const possiblePath = path.resolve(context.pluginArg);
      if (fs.existsSync(possiblePath)) {
        targetDir = possiblePath;
      } else {
        return `Project report failed: path not found: ${possiblePath}`;
      }
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });

    const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    const files = entries.filter((e) => e.isFile()).map((e) => e.name);

    return [
      "=== Project Report Plugin ===",
      `Target: ${targetDir}`,
      `Directories: ${dirs.length}`,
      `Files: ${files.length}`,
      "",
      "Folders:",
      ...(dirs.length ? dirs.map((d) => `- ${d}`) : ["- None"]),
      "",
      "Files:",
      ...(files.length ? files.map((f) => `- ${f}`) : ["- None"]),
    ].join("\n");
  },
};