// Compatibility coverage entrypoint for the legacy console shell.
// Keep live behavior coverage in focused service tests first; this file now
// just imports the split compatibility domains so we can retire them gradually.
import "./console-api-core.test.mjs";
import "./console-api-collaboration.test.mjs";
import "./console-api-operations.test.mjs";
import "./console-api-trust.test.mjs";
