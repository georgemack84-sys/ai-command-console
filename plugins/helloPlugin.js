module.exports = {
  name: "helloPlugin",
  description: "Simple greeting plugin for plugin system testing.",

  async run(context = {}) {
    const userInput = context.input || "No input";
    return `Hello from helloPlugin. Input was: ${userInput}`;
  },
};