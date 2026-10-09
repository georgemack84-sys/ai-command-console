module.exports = Object.freeze({
  name: "helloPlugin",
  description: "Simple greeting plugin for plugin system testing.",
  manifest: Object.freeze({
    name: "helloPlugin",
    version: "1.0.0",
    capabilities: Object.freeze([]),
  }),

  async run(context = {}) {
    const userInput = context.input || "No input";
    return `Hello from helloPlugin. Input was: ${userInput}`;
  },
});
