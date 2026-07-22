import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { renderHealthSummary, ApiClientError } from "../src/api-client.js";

const html = await readFile(new URL("../src/index.html", import.meta.url), "utf-8");
assert.match(html, /Day-to-Day Assistant/);
assert.match(html, /id="app"/);
assert.match(html, /main\.js/);
assert.equal(
  renderHealthSummary({
    status: "healthy",
    components: { database: "healthy", postgres: "reachable" },
  }),
  "API healthy - database healthy - PostgreSQL reachable",
);
assert.equal(new ApiClientError("failed").name, "ApiClientError");
