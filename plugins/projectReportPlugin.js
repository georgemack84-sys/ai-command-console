module.exports = Object.freeze({
  name: "projectReportPlugin",
  description: "Creates a lightweight project report from the current directory or a provided path.",
  manifest: Object.freeze({
    name: "projectReportPlugin",
    version: "1.0.0",
    hostApiVersion: 1,
    capabilities: Object.freeze([Object.freeze({ name: "workspace.list", version: 1 })]),
  }),

  async run(context = {}) {
    const report = context.capabilities.listWorkspaceDirectory(context.pluginArg || ".");

    return [
      "=== Project Report Plugin ===",
      `Target: ${report.path}`,
      `Directories: ${report.directories.length}`,
      `Files: ${report.files.length}`,
      "",
      "Folders:",
      ...(report.directories.length ? report.directories.map((directory) => `- ${directory}`) : ["- None"]),
      "",
      "Files:",
      ...(report.files.length ? report.files.map((file) => `- ${file}`) : ["- None"]),
    ].join("\n");
  },
});
