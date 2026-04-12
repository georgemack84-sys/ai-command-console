// Deprecated compatibility facade for the legacy terminal backend.
// The actual legacy handler implementation now lives in legacyConsoleHandler.js.
// Keep new runtime and product code depending on the extracted services or the
// narrow legacyConsoleCompat adapter instead of importing this module directly.
module.exports = require("./legacyConsoleHandler");
